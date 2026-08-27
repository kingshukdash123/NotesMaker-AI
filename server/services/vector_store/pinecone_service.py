import os
import time
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec

from config.settings import settings
from utils.logger import get_logger
from utils.exceptions import NotesMakerError
from services.llm.service import LLMService
from config.constants import PINECONE_INDEX_DIMENSION, PINECONE_BATCH_SIZE, PINECONE_UPSERT_DELAY


logger = get_logger(__name__)


class PineconeIndexer:
    """
    Service to manage Pinecone vector search index creation, self-healing, and segment indexing.
    Specifically rate-limits Google Gemini Embedding generation to stay below the 30K TPM free tier limit.
    """

    def __init__(self, google_api_key: Optional[str] = None):
        self.google_api_key = google_api_key

        # Initialize langchain-google-genai embeddings (Gemini Embedding 2 outputs 3072 dimensions)
        self.embeddings = LLMService.get_embeddings(
            google_api_key=self.google_api_key
        )


        # Connect to Pinecone
        pinecone_api_key = settings.PINECONE_API_KEY
        if not pinecone_api_key:
            logger.warning("PINECONE_API_KEY is missing. Indexer is disabled.")
            self.pc = None
            return

        self.pc = Pinecone(api_key=pinecone_api_key)
        self.index_name = settings.PINECONE_INDEX_NAME


        try:
            self._ensure_index_setup()
            self.index = self.pc.Index(self.index_name)
        except Exception as e:
            logger.exception("Failed to connect or setup Pinecone index.")
            self.pc = None

    def _ensure_index_setup(self):
        """Self-healing index verification and creation (with 3072 dimensions)."""
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]

        if self.index_name in existing_indexes:
            # Check dimension
            desc = self.pc.describe_index(self.index_name)
            if desc.dimension != PINECONE_INDEX_DIMENSION:
                logger.info(
                    "Pinecone index dimension mismatch (%d vs %d). Deleting and recreating...",
                    desc.dimension,
                    PINECONE_INDEX_DIMENSION,
                )
                self.pc.delete_index(self.index_name)
                self._create_index()
        else:
            self._create_index()

    def _create_index(self):
        """Creates the Pinecone index on serverless AWS with configured dimension."""
        logger.info("Creating new Pinecone index '%s' with %d dimensions...", self.index_name, PINECONE_INDEX_DIMENSION)
        self.pc.create_index(
            name=self.index_name,
            dimension=PINECONE_INDEX_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )

        # Wait until the index is fully ready
        while not self.pc.describe_index(self.index_name).status["ready"]:
            logger.info("Waiting for Pinecone index to initialize...")
            time.sleep(2)
        logger.info("Pinecone index initialized successfully.")

    def index_transcript(self, video_id: str, segments: List[Dict[str, Any]]) -> None:
        """
        Embeds and indexes merged transcript segments into Pinecone under the video's namespace.
        Respects the 30K TPM rate limit by chunking segments and sleeping.
        """
        if not self.pc:
            logger.warning("Pinecone indexer is not configured. Skipping transcript indexing.")
            return

        if not segments:
            logger.warning("No transcript segments found to index.")
            return

        # Check if namespace already exists with vectors in Pinecone to avoid duplicate embeddings/uploads
        try:
            stats = self.index.describe_index_stats()
            if video_id in stats.namespaces and stats.namespaces[video_id].vector_count > 0:
                logger.info(
                    "Video '%s' is already indexed in Pinecone (%d vectors found). Skipping duplicate indexing.",
                    video_id,
                    stats.namespaces[video_id].vector_count,
                )
                return
        except Exception as e:
            logger.warning("Failed to fetch index stats from Pinecone. Proceeding with indexing anyway: %s", str(e))

        logger.info(
            "Starting indexing of %d transcript segments for video: %s",
            len(segments),
            video_id,
        )

        batch_size = PINECONE_BATCH_SIZE  # Batch size chosen to consume ~8,000 tokens per batch (well under 30K TPM)
        total_batches = (len(segments) + batch_size - 1) // batch_size


        for i in range(total_batches):
            start_idx = i * batch_size
            end_idx = min(start_idx + batch_size, len(segments))
            batch = segments[start_idx:end_idx]

            logger.info("Embedding batch %d/%d (segments %d to %d)...", i + 1, total_batches, start_idx + 1, end_idx)
            
            texts = [seg["text"] for seg in batch]
            try:
                embeddings_list = self.embeddings.embed_documents(texts)
            except Exception as e:
                logger.exception("Failed to generate embeddings via Gemini API.")
                raise NotesMakerError(
                    message="Failed to generate document embeddings during Pinecone indexing.",
                    code="EMBEDDING_GENERATION_FAILED",
                    status_code=500,
                ) from e

            # Prepare vectors payload
            vectors = []
            for idx, seg in enumerate(batch):
                vector_id = f"{video_id}_{seg['id']}"
                vectors.append(
                    {
                        "id": vector_id,
                        "values": embeddings_list[idx],
                        "metadata": {
                            "video_id": video_id,
                            "text": seg["text"],
                            "start": float(seg["start"]),
                            "end": float(seg["end"]),
                        },
                    }
                )

            # Upsert vectors to Pinecone under the video_id namespace
            try:
                self.index.upsert(vectors=vectors, namespace=video_id)
            except Exception as e:
                logger.exception("Pinecone upsert failed.")
                raise NotesMakerError(
                    message="Failed to index vectors in Pinecone.",
                    code="PINECONE_UPSERT_FAILED",
                    status_code=500,
                ) from e

            logger.info("Successfully indexed batch %d/%d.", i + 1, total_batches)

            # Introduce delay to avoid hitting the 30K TPM rate limit on Gemini Embedding 2
            if i < total_batches - 1:
                sleep_time = PINECONE_UPSERT_DELAY
                logger.info("Sleeping for %s seconds to respect the rate limit...", sleep_time)
                time.sleep(sleep_time)


        logger.info("Pinecone indexing completed successfully for video: %s", video_id)
