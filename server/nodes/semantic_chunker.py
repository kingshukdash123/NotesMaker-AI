from server.logger import get_logger
from server.services.chunking.semantic_chunker import semantic_chunk_transcript

logger = get_logger(__name__)


def semantic_chunker(state: dict) -> dict:
    """
    LangGraph node for semantic chunking.
    """

    logger.info("Semantic Chunker node started.")

    state["chunks"] = semantic_chunk_transcript(
        state["merged_transcript"]
    )

    logger.info("Semantic Chunker node completed.")

    return state