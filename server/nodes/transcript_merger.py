from utils.logger import get_logger
from services.transcript.merger import merge_transcript

logger = get_logger(__name__)


def transcript_merger(state: dict) -> dict:
    """
    Merge transcript into paragraphs.
    """

    logger.info("Segmenting and formatting transcript content.")

    state["merged_transcript"] = merge_transcript(
        state["transcript_segments"]
    )

    logger.info("Transcript formatting completed.")

    return state