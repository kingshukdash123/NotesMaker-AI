from urllib.parse import urlparse, parse_qs

from server.logger import get_logger
from server.exceptions import NotesMakerError

logger = get_logger(__name__)


def extract_video_id(url: str) -> str:
    """
    Validate a YouTube URL and return the video ID.
    """

    logger.info("Validating YouTube URL...")

    parsed_url = urlparse(url)

    # Short URL
    if parsed_url.netloc == "youtu.be":
        video_id = parsed_url.path.lstrip("/")

    # Normal URL
    elif "youtube.com" in parsed_url.netloc:
        video_id = parse_qs(parsed_url.query).get("v", [None])[0]

    else:
        logger.error("Invalid YouTube URL.")
        raise NotesMakerError(
            message="Invalid YouTube URL.",
            code="INVALID_URL",
            status_code=400,
        )

    if not video_id:
        logger.error("Video ID not found.")
        raise NotesMakerError(
            message="Video ID not found.",
            code="INVALID_VIDEO_ID",
            status_code=400,
        )

    logger.info(f"Video ID extracted: {video_id}")

    return video_id