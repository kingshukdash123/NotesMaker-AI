from utils.logger import get_logger
from services.youtube.validator import extract_video_id
from services.youtube.metadata import get_video_metadata
from services.youtube.transcript import get_transcript

logger = get_logger(__name__)


def generate_transcript_and_metadata(url: str) -> dict:
    """
    Generate transcript and metadata for a YouTube video.
    """

    logger.info("Retrieving video content and metadata.")

    # Validate URL
    video_id = extract_video_id(url)

    # Fetch metadata
    metadata = get_video_metadata(video_id)

    # Fetch transcript
    transcript = get_transcript(video_id)

    logger.info("Video content and metadata retrieved successfully.")

    return {
        "metadata": metadata,
        "transcript": transcript,
    }