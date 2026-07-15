from server.logger import get_logger
from server.services.youtube.validator import extract_video_id
from server.services.youtube.metadata import get_video_metadata
from server.services.youtube.transcript import get_transcript

logger = get_logger(__name__)


def generate_transcript_and_metadata(url: str) -> dict:
    """
    Generate transcript and metadata for a YouTube video.
    """

    logger.info("Starting transcript generation...")

    # Validate URL
    video_id = extract_video_id(url)

    # Fetch metadata
    metadata = get_video_metadata(url)

    # Fetch transcript
    transcript = get_transcript(video_id)

    logger.info("Transcript generation completed successfully.")

    return {
        "metadata": metadata,
        "transcript": transcript,
    }