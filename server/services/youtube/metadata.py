import yt_dlp

from utils.logger import get_logger
from utils.exceptions import NotesMakerError
from model.metadata import VideoMetadata

logger = get_logger(__name__)


def get_video_metadata(url: str) -> VideoMetadata:
    """
    Fetch metadata from a YouTube video using yt-dlp.
    """

    logger.info("Fetching video metadata...")

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        metadata: VideoMetadata = {
            "video_id": info["id"],
            "title": info["title"],
            "channel": info["uploader"],
            "duration": info["duration"],
            "description": info.get("description", ""),
            "upload_date": info.get("upload_date", ""),
            "thumbnail": info.get("thumbnail", ""),
            "language": info.get("language", ""),
        }

        logger.info("Video metadata fetched successfully.")

        return metadata

    except Exception as e:
        logger.exception("Failed to fetch metadata")

        raise NotesMakerError(
            message="Failed to fetch video metadata.",
            code="METADATA_ERROR",
            status_code=500,
        )