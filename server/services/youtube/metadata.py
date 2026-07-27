import os
import httpx
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

from utils.logger import get_logger
from utils.exceptions import NotesMakerError
from model.metadata import VideoMetadata

logger = get_logger(__name__)


def get_video_metadata(video_id: str) -> VideoMetadata:
    """
    Fetch metadata from a YouTube video.
    In production/cloud, fetches from TranscriptAPI.com (includes info & available languages).
    In local development, falls back to YouTube's public oEmbed API for basic info,
    and lists available languages using YouTubeTranscriptApi.
    """
    is_cloud = os.getenv("ENV") == "production"
    api_key = os.getenv("TRANSCRIPT_API_KEY")

    if is_cloud and api_key:
        logger.info(f"Fetching metadata using TranscriptAPI.com for video: {video_id}")
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
                    logger.info("Video metadata and languages fetched successfully from TranscriptAPI.")
                    return metadata
                else:
                    logger.error(f"TranscriptAPI info failed with status {response.status_code}: {response.text}")
        except Exception as err:
            logger.exception(f"TranscriptAPI info fetch failed: {str(err)}")
        
        raise NotesMakerError(
            message="Failed to fetch video metadata from TranscriptAPI.",
            code="METADATA_ERROR",
            status_code=500,
        )

    # Local development fallback
    logger.info("Local environment: Fetching video metadata using oEmbed...")
    metadata: VideoMetadata = {
        "video_id": video_id,
        "title": "YouTube Video",
        "channel": "YouTube Creator",
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "available_languages": [],
    }

    # 1. Fetch basic metadata via oEmbed
    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        with httpx.Client() as client:
            response = client.get(oembed_url, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                metadata["title"] = data.get("title", "YouTube Video")
                metadata["channel"] = data.get("author_name", "YouTube Creator")
                metadata["thumbnail"] = data.get("thumbnail_url", f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg")
                logger.info("Basic metadata fetched successfully using YouTube oEmbed.")
            else:
                logger.warning(f"oEmbed API query failed with status code {response.status_code}")
    except Exception as err:
        logger.warning(f"oEmbed fetch failed: {str(err)}")

    # 2. Fetch available languages via local YouTubeTranscriptApi
    try:
        logger.info("Fetching available transcript languages locally...")
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        available_languages = []
        for t in transcript_list:
            available_languages.append({
                "code": t.language_code,
                "name": t.language
            })
        metadata["available_languages"] = available_languages
        logger.info(f"Locally found {len(available_languages)} available transcript language(s).")
    except (TranscriptsDisabled, NoTranscriptFound) as e:
        logger.warning(f"No transcripts found locally for {video_id}: {str(e)}")
    except Exception as err:
        logger.warning(f"Local transcript listing failed: {str(err)}")

    return metadata