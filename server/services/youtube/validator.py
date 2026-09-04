import re
from urllib.parse import urlparse, parse_qs

from utils.logger import get_logger
from utils.exceptions import PathshalaError

logger = get_logger(__name__)


def extract_video_id(url: str) -> str:
    """
    Validate a YouTube URL or direct video ID and return the 11-character video ID.
    Supports:
    - Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
    - Short URLs: https://youtu.be/VIDEO_ID
    - Live stream URLs: https://www.youtube.com/live/VIDEO_ID
    - YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
    - Embedded URLs: https://www.youtube.com/embed/VIDEO_ID
    - Mobile URLs: https://m.youtube.com/...
    - Raw 11-character video IDs
    """
    if not url or not isinstance(url, str):
        raise PathshalaError(
            message="Invalid YouTube URL provided.",
            code="INVALID_URL",
            status_code=400,
        )

    raw_input = url.strip()

    # Direct 11-character video ID
    if re.fullmatch(r"[a-zA-Z0-9_-]{11}", raw_input):
        return raw_input

    logger.info("Validating video source URL...")
    video_id = None

    try:
        parsed_url = urlparse(raw_input if "://" in raw_input else f"https://{raw_input}")
        netloc = parsed_url.netloc.lower()

        # 1. Short URL: youtu.be/ID
        if "youtu.be" in netloc:
            parts = parsed_url.path.strip("/").split("/")
            if parts and re.fullmatch(r"[a-zA-Z0-9_-]{11}", parts[0]):
                video_id = parts[0]

        # 2. Standard / Mobile / Subdomain YouTube URLs
        elif "youtube.com" in netloc:
            # Check ?v= query parameter
            qs_v = parse_qs(parsed_url.query).get("v", [None])[0]
            if qs_v and re.fullmatch(r"[a-zA-Z0-9_-]{11}", qs_v):
                video_id = qs_v
            else:
                # Check path segments: /live/ID, /shorts/ID, /embed/ID, /v/ID
                parts = [p for p in parsed_url.path.strip("/").split("/") if p]
                for idx, part in enumerate(parts):
                    if part in ("live", "shorts", "embed", "v", "video") and idx + 1 < len(parts):
                        candidate = parts[idx + 1]
                        if re.fullmatch(r"[a-zA-Z0-9_-]{11}", candidate):
                            video_id = candidate
                            break
    except Exception as e:
        logger.warning(f"URL parsing encountered error: {e}")

    # Fallback regex search
    if not video_id:
        match = re.search(
            r"(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([\w-]{11})",
            raw_input,
        )
        if match:
            video_id = match.group(1)

    if not video_id:
        logger.error(f"Could not extract valid video ID from URL: {url}")
        raise PathshalaError(
            message="Invalid YouTube URL. Could not find a valid video ID.",
            code="INVALID_VIDEO_ID",
            status_code=400,
        )

    logger.info(f"Video resource validated successfully: {video_id}")
    return video_id