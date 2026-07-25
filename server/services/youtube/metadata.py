import os
import yt_dlp
import httpx

from utils.logger import get_logger
from utils.exceptions import NotesMakerError
from model.metadata import VideoMetadata
from services.youtube.validator import extract_video_id

logger = get_logger(__name__)


def get_video_metadata(url: str) -> VideoMetadata:
    """
    Fetch metadata from a YouTube video using yt-dlp, with a robust HTTP fallback
    to YouTube's public oEmbed API if blocked by bot detection.
    """

    logger.info("Fetching video metadata...")

    # Configure yt-dlp
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
    }

    user_agent = os.getenv("USER_AGENT")
    if user_agent:
        ydl_opts["http_headers"] = {"User-Agent": user_agent}
        logger.info("Using custom User-Agent for yt-dlp.")

    if os.path.exists("cookies.txt"):
        ydl_opts["cookiefile"] = "cookies.txt"
        logger.info("Using cookies.txt file for yt-dlp metadata extraction.")

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

        logger.info("Video metadata fetched successfully using yt-dlp.")
        return metadata

    except Exception as e:
        logger.warning(f"yt-dlp failed to fetch metadata. Attempting oEmbed fallback...")
        
        try:
            video_id = extract_video_id(url)
            # Query YouTube's public oEmbed API (does not require API keys or auth, and is not IP blocked)
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            
            with httpx.Client() as client:
                response = client.get(oembed_url, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    
                    fallback_metadata: VideoMetadata = {
                        "video_id": video_id,
                        "title": data.get("title", "YouTube Video"),
                        "channel": data.get("author_name", "YouTube Creator"),
                        "duration": 0,  # oEmbed does not return duration
                        "description": "Description unavailable in production mode.",
                        "upload_date": "",
                        "thumbnail": data.get("thumbnail_url", f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"),
                        "language": "en",
                    }
                    logger.info("Video metadata fetched successfully using YouTube oEmbed fallback.")
                    return fallback_metadata
                else:
                    logger.error(f"oEmbed API query failed with status code {response.status_code}")
        except Exception as fallback_err:
            logger.exception(f"oEmbed fallback failed: {str(fallback_err)}")

        raise NotesMakerError(
            message="Failed to fetch video metadata.",
            code="METADATA_ERROR",
            status_code=500,
        )