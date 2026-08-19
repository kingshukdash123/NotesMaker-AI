from utils.logger import get_logger
from services.youtube.generator import generate_transcript_and_metadata

logger = get_logger(__name__)


def transcript_metadata_generator(state: dict) -> dict:
    """
    LangGraph node that fetches transcript and metadata.
    """

    logger.info("Starting ingestion of video metadata and transcripts.")

    url = state["youtube_url"]

    result = generate_transcript_and_metadata(url)

    state["metadata"] = result["metadata"]
    state["transcript_segments"] = result["transcript"]

    logger.info("Successfully ingested video metadata and transcripts.")

    return state