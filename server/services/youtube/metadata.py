import os
import httpx
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from config.settings import settings

from utils.logger import get_logger
from utils.exceptions import PathshalaError
from model.metadata import VideoMetadata

logger = get_logger(__name__)


def get_video_metadata(video_id: str) -> VideoMetadata:
    """
    Fetch metadata from a YouTube video.
    In production/cloud, fetches from TranscriptAPI.com (includes info & available languages).
    In local development, falls back to YouTube's public oEmbed API for basic info,
    and lists available languages using YouTubeTranscriptApi.
    """
    is_cloud = settings.ENV == "production"
    api_key = settings.TRANSCRIPT_API_KEY


    if is_cloud and api_key:
        logger.info("Fetching metadata from metadata service.")
        try:
            url = f"https://transcriptapi.com/api/v2/youtube/info?video_url={video_id}"
            headers = {"Authorization": f"Bearer {api_key}"}
            with httpx.Client() as client:
                response = client.get(url, headers=headers, timeout=15.0)
                if response.status_code == 200:
                    data = response.json()
                    api_metadata = data.get("metadata", {})
                    metadata: VideoMetadata = {
                        "video_id": video_id,
                        "title": api_metadata.get("title", "YouTube Video"),
                        "channel": api_metadata.get("author_name", "YouTube Creator"),
                        "thumbnail": api_metadata.get("thumbnail_url", f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"),
                        "available_languages": data.get("available_languages", []),
                    }
                    logger.info("Video metadata and languages fetched successfully.")
                    return metadata
                else:
                    logger.error(f"Metadata service info failed with status {response.status_code}")
        except Exception as err:
            logger.exception("Metadata service info fetch failed.")
        
        raise PathshalaError(
            message="Failed to fetch video metadata from metadata service.",
            code="METADATA_ERROR",
            status_code=500,
        )

    # Local development fallback
    logger.info("Fetching video metadata...")
    metadata: VideoMetadata = {
        "video_id": video_id,
        "title": "YouTube Video",
        "channel": "YouTube Creator",
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "available_languages": [],
        "is_live": False,
    }

    # Optional: Check YouTube API for live stream status and rich details if key is available
    yt_api_key = settings.YOUTUBE_API_KEY
    if yt_api_key:
        try:
            yt_url = "https://www.googleapis.com/youtube/v3/videos"
            params = {
                "part": "snippet,liveStreamingDetails",
                "id": video_id,
                "key": yt_api_key,
            }
            with httpx.Client() as client:
                yt_res = client.get(yt_url, params=params, timeout=8.0)
                if yt_res.status_code == 200:
                    items = yt_res.json().get("items", [])
                    if items:
                        item = items[0]
                        snippet = item.get("snippet", {})
                        live_details = item.get("liveStreamingDetails", {})
                        metadata["title"] = snippet.get("title", metadata["title"])
                        metadata["channel"] = snippet.get("channelTitle", metadata["channel"])
                        
                        thumbs = snippet.get("thumbnails", {})
                        thumb_url = (
                            thumbs.get("high", {}).get("url")
                            or thumbs.get("medium", {}).get("url")
                            or thumbs.get("default", {}).get("url")
                        )
                        if thumb_url:
                            metadata["thumbnail"] = thumb_url
                        
                        live_content = snippet.get("liveBroadcastContent", "none")
                        is_active_live = live_content == "live" or (
                            bool(live_details.get("actualStartTime")) and not bool(live_details.get("actualEndTime"))
                        )
                        metadata["is_live"] = is_active_live
                        logger.info(f"YouTube Data API metadata fetched. is_live={is_active_live}")
        except Exception as yt_err:
            logger.warning(f"Failed to fetch metadata from YouTube Data API: {yt_err}")

    # 1. Fetch basic metadata via oEmbed if title is still default
    if metadata["title"] == "YouTube Video":
        try:
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            with httpx.Client() as client:
                response = client.get(oembed_url, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    metadata["title"] = data.get("title", metadata["title"])
                    metadata["channel"] = data.get("author_name", metadata["channel"])
                    metadata["thumbnail"] = data.get("thumbnail_url", metadata["thumbnail"])
                    logger.info("Basic metadata fetched via oEmbed successfully.")
                else:
                    logger.warning(f"Metadata API query failed with status code {response.status_code}")
        except Exception as err:
            logger.warning("Metadata fetch failed.")

    # 2. Check live status via watch page if not already determined
    if not yt_api_key and not metadata.get("is_live"):
        try:
            watch_url = f"https://www.youtube.com/watch?v={video_id}"
            with httpx.Client(follow_redirects=True) as client:
                watch_res = client.get(watch_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5.0)
                if watch_res.status_code == 200:
                    text = watch_res.text
                    if '"isLive":true' in text or '"isLiveNow":true' in text or '"liveBroadcastDetails"' in text:
                        metadata["is_live"] = True
                        logger.info("Detected active live stream via watch page indicators.")
        except Exception as live_check_err:
            logger.debug(f"Live status fallback check skipped: {live_check_err}")

    # 3. Fetch available languages via local YouTubeTranscriptApi (only if not an active live stream)
    if not metadata.get("is_live"):
        try:
            logger.info("Fetching available languages locally...")
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            available_languages = []
            for t in transcript_list:
                available_languages.append({
                    "code": t.language_code,
                    "name": t.language
                })
            metadata["available_languages"] = available_languages
            logger.info(f"Locally found {len(available_languages)} available language(s).")
        except (TranscriptsDisabled, NoTranscriptFound) as e:
            logger.warning("No transcripts found locally.")
        except Exception as err:
            logger.warning("Local listing failed.")

    return metadata