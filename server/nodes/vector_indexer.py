from utils.logger import get_logger
from services.vector_store.pinecone_service import PineconeIndexer

logger = get_logger(__name__)


def vector_indexer_node(state: dict) -> dict:
    """
    LangGraph node that runs in parallel to generate embeddings
    and index transcript paragraphs into Pinecone.
    """
    logger.info("[stage: indexing] Vector Indexer node started.")

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

    try:
        logger.info("[stage: indexing] Initializing Pinecone vector indexing...")
        indexer = PineconeIndexer(google_api_key=google_api_key)
        
        logger.info("[stage: indexing] Beginning embedding and upload of transcript paragraphs...")
        indexer.index_transcript(video_id=video_id, segments=merged_transcript)
        
        logger.info("[stage: indexing] Vector Indexer node completed successfully.")
    except Exception as e:
        logger.exception("[stage: indexing] Non-critical error during transcript indexing.")
        # Catch exception so notes generation doesn't fail even if Pinecone indexing fails
        logger.error("[stage: indexing] Vector indexing failed. Q&A might be unavailable.")

    return {}
