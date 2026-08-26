import asyncio
import threading
from utils.logger import get_logger
from services.vector_store.pinecone_service import PineconeIndexer

logger = get_logger(__name__)


def vector_indexer_node(state: dict) -> dict:
    """
    LangGraph node that runs in parallel to generate embeddings
    and index transcript paragraphs into Pinecone in the background.
    """
    logger.info("[stage: indexing] Vector Indexer node triggered.")

    metadata = state.get("metadata", {})
    video_id = metadata.get("video_id")
    google_api_key = state.get("google_api_key")
    merged_transcript = state.get("merged_transcript", [])

    if not video_id:
        logger.error("[stage: indexing] Video ID is missing in metadata. Skipping vector indexing.")
        return {}

    if not merged_transcript:
        logger.warning("[stage: indexing] Merged transcript is empty. Skipping vector indexing.")
        return {}

    # Define execution task for background thread
    def run_indexing():
        try:
            logger.info("[stage: indexing] Initializing Pinecone vector indexing...")
            indexer = PineconeIndexer(google_api_key=google_api_key)
            
            logger.info("[stage: indexing] Beginning embedding and upload of transcript paragraphs...")
            indexer.index_transcript(video_id=video_id, segments=merged_transcript)
            
            logger.info("[stage: indexing] Vector Indexer completed successfully in the background.")
        except Exception as e:
            logger.exception("[stage: indexing] Non-critical error during transcript indexing.")
            # Catch exception so notes generation doesn't fail even if Pinecone indexing fails
            logger.error("[stage: indexing] Vector indexing failed. Q&A might be unavailable.")

    # Schedule the sync task to run in a separate thread asynchronously
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(asyncio.to_thread(run_indexing))
        logger.info("[stage: indexing] Scheduled vector indexing in background thread task.")
    except RuntimeError:
        # Fallback if no running event loop
        t = threading.Thread(target=run_indexing)
        t.start()
        logger.info("[stage: indexing] Started vector indexing in background OS thread.")

    return {}
