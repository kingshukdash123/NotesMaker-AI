from utils.logger import get_logger
from services.youtube.generator import generate_transcript_and_metadata

logger = get_logger(__name__)


def transcript_metadata_generator(state: dict) -> dict:
    """
    LangGraph node that fetches transcript and metadata.
    """

    logger.info("Transcript & Metadata Generator node started.")

    url = state["youtube_url"]

    result = generate_transcript_and_metadata(url)

    state["metadata"] = result["metadata"]
    state["transcript_segments"] = result["transcript"]

    logger.info("Transcript & Metadata Generator node completed success.")

    return state