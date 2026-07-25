import httpx

from utils.logger import get_logger
from utils.exceptions import NotesMakerError
from model.metadata import VideoMetadata
from services.youtube.validator import extract_video_id

logger = get_logger(__name__)


def get_video_metadata(url: str) -> VideoMetadata:
    """
    Fetch metadata from a YouTube video using YouTube's public oEmbed API.
    This does not require API keys or auth, and is not IP blocked.
    """
    logger.info("Fetching video metadata using oEmbed...")
    
    try:
        video_id = extract_video_id(url)
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        
        with httpx.Client() as client:
            response = client.get(oembed_url, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                
                metadata: VideoMetadata = {
                    "video_id": video_id,
                    "title": data.get("title", "YouTube Video"),
                    "channel": data.get("author_name", "YouTube Creator"),
                    "thumbnail": data.get("thumbnail_url", f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"),
                }
                logger.info("Video metadata fetched successfully using YouTube oEmbed.")
                return metadata
            else:
                logger.error(f"oEmbed API query failed with status code {response.status_code}")
    except Exception as err:
        logger.exception(f"oEmbed fetch failed: {str(err)}")

    raise NotesMakerError(
        message="Failed to fetch video metadata.",
        code="METADATA_ERROR",
        status_code=500,
    )