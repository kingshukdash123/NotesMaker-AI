import os
import re
from typing import Dict, List, Optional
import httpx
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

from config.settings import settings
from utils.logger import get_logger
from utils.exceptions import PathshalaError
from model.metadata import VideoMetadata

logger = get_logger(__name__)


def parse_iso8601_duration(duration_str: Optional[str]) -> int:
    """
    Parse ISO 8601 duration format (e.g. 'PT1H2M10S', 'PT15M', 'PT45S', 'P1DT2H') into total seconds.
    """
    if not duration_str:
        return 0
    pattern = re.compile(
        r"P(?:(?P<days>\d+)D)?(?:T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?)?$"
    )
    match = pattern.match(duration_str)
    if not match:
        return 0
    parts = match.groupdict()
    days = int(parts.get("days") or 0)
    hours = int(parts.get("hours") or 0)
    minutes = int(parts.get("minutes") or 0)
    seconds = int(parts.get("seconds") or 0)
    return days * 86400 + hours * 3600 + minutes * 60 + seconds


def format_duration_seconds(seconds: int) -> str:
    """
    Format total seconds into MM:SS or HH:MM:SS string.
    """
    if seconds <= 0:
        return "0:00"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


def get_best_thumbnail(thumbnails: dict, fallback_video_id: str = "") -> str:
    """
    Extract the highest resolution thumbnail URL available from a YouTube thumbnails object.
    Priority: maxres -> standard -> high -> medium -> default -> fallback.
    """
    if thumbnails and isinstance(thumbnails, dict):
        for quality in ("maxres", "standard", "high", "medium", "default"):
            url = thumbnails.get(quality, {}).get("url")
            if url:
                return url
    if fallback_video_id:
        return f"https://img.youtube.com/vi/{fallback_video_id}/hqdefault.jpg"
    return ""


def get_video_metadata(video_id: str) -> VideoMetadata:
    """
    Fetch comprehensive video metadata using the official YouTube Data API v3.
    Extracts title, channel, description, high-res thumbnail, exact duration,
    live stream status, view counts, and available subtitle languages.
    Falls back gracefully to oEmbed + YouTubeTranscriptApi if API key is missing or quota fails.
    """
    clean_id = video_id.strip()
    api_key = (settings.YOUTUBE_API_KEY or "").strip()

    metadata: VideoMetadata = {
        "video_id": clean_id,
        "title": "YouTube Video",
        "channel": "YouTube Creator",
        "thumbnail": f"https://img.youtube.com/vi/{clean_id}/hqdefault.jpg",
        "duration": 0,
        "duration_formatted": "0:00",
        "available_languages": [],
        "is_live": False,
        "is_live_archive": False,
        "is_upcoming": False,
    }

    # 1. Primary: Official YouTube Data API v3
    if api_key:
        logger.info(f"Fetching official YouTube Data API v3 metadata for video_id: {clean_id}")
        try:
            yt_url = "https://www.googleapis.com/youtube/v3/videos"
            params = {
                "part": "snippet,contentDetails,statistics,liveStreamingDetails,status",
                "id": clean_id,
                "key": api_key,
            }
            with httpx.Client() as client:
                yt_res = client.get(yt_url, params=params, timeout=12.0)
                if yt_res.status_code == 200:
                    items = yt_res.json().get("items", [])
                    if items:
                        item = items[0]
                        snippet = item.get("snippet", {})
                        content_details = item.get("contentDetails", {})
                        statistics = item.get("statistics", {})
                        live_details = item.get("liveStreamingDetails", {})
                        status = item.get("status", {})

                        # Title & Channel
                        metadata["title"] = snippet.get("title", metadata["title"])
                        metadata["channel"] = snippet.get("channelTitle", metadata["channel"])
                        if snippet.get("channelId"):
                            metadata["channel_id"] = snippet.get("channelId")
                        if snippet.get("description"):
                            metadata["description"] = snippet.get("description")
                        if snippet.get("publishedAt"):
                            metadata["published_at"] = snippet.get("publishedAt")
                        if snippet.get("tags"):
                            metadata["tags"] = snippet.get("tags")
                        if snippet.get("categoryId"):
                            metadata["category_id"] = snippet.get("categoryId")
                        if snippet.get("defaultLanguage") or snippet.get("defaultAudioLanguage"):
                            metadata["default_language"] = snippet.get("defaultLanguage") or snippet.get("defaultAudioLanguage")

                        # Thumbnail
                        best_thumb = get_best_thumbnail(snippet.get("thumbnails", {}), clean_id)
                        if best_thumb:
                            metadata["thumbnail"] = best_thumb

                        # Duration parsing (ISO 8601 -> seconds)
                        iso_duration = content_details.get("duration", "")
                        duration_sec = parse_iso8601_duration(iso_duration)
                        metadata["duration"] = duration_sec
                        metadata["duration_formatted"] = format_duration_seconds(duration_sec)

                        # Embeddable status
                        if "embeddable" in status:
                            metadata["embeddable"] = status.get("embeddable")

                        # Live stream states
                        live_content = snippet.get("liveBroadcastContent", "none")
                        is_active_live = (live_content == "live") or (
                            bool(live_details.get("actualStartTime")) and not bool(live_details.get("actualEndTime"))
                        )
                        metadata["is_live"] = is_active_live
                        metadata["is_live_archive"] = live_content == "completed" or (
                            bool(live_details.get("actualEndTime"))
                        )
                        metadata["is_upcoming"] = live_content == "upcoming"

                        # Statistics
                        if statistics.get("viewCount") is not None:
                            try:
                                metadata["view_count"] = int(statistics.get("viewCount"))
                            except (ValueError, TypeError):
                                metadata["view_count"] = statistics.get("viewCount")
                        if statistics.get("likeCount") is not None:
                            try:
                                metadata["like_count"] = int(statistics.get("likeCount"))
                            except (ValueError, TypeError):
                                metadata["like_count"] = statistics.get("likeCount")
                        if statistics.get("commentCount") is not None:
                            try:
                                metadata["comment_count"] = int(statistics.get("commentCount"))
                            except (ValueError, TypeError):
                                metadata["comment_count"] = statistics.get("commentCount")

                        logger.info(
                            f"Official YouTube Data API metadata retrieved: title='{metadata['title']}', "
                            f"duration={metadata['duration_formatted']} ({metadata['duration']}s), is_live={metadata['is_live']}"
                        )
                    else:
                        logger.warning(f"YouTube Data API returned 0 items for video_id={clean_id}. Video might be private or deleted.")
                else:
                    logger.warning(f"YouTube Data API request returned status {yt_res.status_code}: {yt_res.text[:200]}")
        except Exception as yt_err:
            logger.exception(f"Error querying YouTube Data API for video {clean_id}: {yt_err}")

    # 2. Fallback: oEmbed if title is still default (e.g. no API key or API call failed)
    if metadata["title"] == "YouTube Video":
        logger.info(f"Using oEmbed fallback for video metadata: {clean_id}")
        try:
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={clean_id}&format=json"
            with httpx.Client() as client:
                response = client.get(oembed_url, timeout=8.0)
                if response.status_code == 200:
                    data = response.json()
                    metadata["title"] = data.get("title", metadata["title"])
                    metadata["channel"] = data.get("author_name", metadata["channel"])
                    metadata["thumbnail"] = data.get("thumbnail_url", metadata["thumbnail"])
                    logger.info("Basic metadata fetched via oEmbed successfully.")
        except Exception as err:
            logger.warning(f"oEmbed fallback failed for {clean_id}: {err}")

    # 3. Available subtitle languages listing (via YouTubeTranscriptApi)
    if not metadata.get("is_live"):
        try:
            logger.info("Fetching available transcript languages...")
            transcript_list = YouTubeTranscriptApi.list_transcripts(clean_id)
            available_languages = []
            for t in transcript_list:
                available_languages.append({
                    "code": t.language_code,
                    "name": t.language,
                    "is_generated": t.is_generated,
                })
            metadata["available_languages"] = available_languages
            logger.info(f"Found {len(available_languages)} available subtitle language(s).")
        except (TranscriptsDisabled, NoTranscriptFound):
            logger.info("No public transcripts found for video.")
        except Exception as err:
            logger.debug(f"Subtitle language check skipped: {err}")

    return metadata


def get_batch_video_details(video_ids: List[str]) -> Dict[str, Dict]:
    """
    Fetch contentDetails and statistics for a batch of up to 50 video IDs in a single YouTube Data API call.
    Consumes only 1 quota unit. Returns a mapping of video_id -> details dict.
    """
    api_key = (settings.YOUTUBE_API_KEY or "").strip()
    if not api_key or not video_ids:
        return {}

    unique_ids = [vid.strip() for vid in video_ids if vid and vid.strip()][:50]
    if not unique_ids:
        return {}

    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet,contentDetails,statistics,liveStreamingDetails",
        "id": ",".join(unique_ids),
        "key": api_key,
    }

    results = {}
    try:
        with httpx.Client() as client:
            response = client.get(url, params=params, timeout=12.0)
            if response.status_code == 200:
                items = response.json().get("items", [])
                for item in items:
                    v_id = item.get("id")
                    if not v_id:
                        continue
                    snippet = item.get("snippet", {})
                    content_details = item.get("contentDetails", {})
                    stats = item.get("statistics", {})
                    live_details = item.get("liveStreamingDetails", {})

                    duration_sec = parse_iso8601_duration(content_details.get("duration", ""))
                    live_content = snippet.get("liveBroadcastContent", "none")
                    is_live = (live_content == "live") or (
                        bool(live_details.get("actualStartTime")) and not bool(live_details.get("actualEndTime"))
                    )

                    results[v_id] = {
                        "duration": duration_sec,
                        "durationFormatted": format_duration_seconds(duration_sec),
                        "viewCount": stats.get("viewCount", "0"),
                        "likeCount": stats.get("likeCount", "0"),
                        "commentCount": stats.get("commentCount", "0"),
                        "isLive": is_live,
                        "liveBroadcastContent": live_content,
                        "publishedAt": snippet.get("publishedAt", ""),
                        "channelTitle": snippet.get("channelTitle", ""),
                        "channelId": snippet.get("channelId", ""),
                        "description": snippet.get("description", ""),
                        "thumbnail": get_best_thumbnail(snippet.get("thumbnails", {}), v_id),
                    }
    except Exception as e:
        logger.warning(f"Batch video details fetch failed: {e}")

    return results


def get_batch_playlist_details(playlist_ids: List[str]) -> Dict[str, Dict]:
    """
    Fetch snippet and contentDetails for a batch of up to 50 playlist IDs in a single YouTube Data API call.
    Consumes only 1 quota unit. Returns a mapping of playlist_id -> details dict.
    """
    api_key = (settings.YOUTUBE_API_KEY or "").strip()
    if not api_key or not playlist_ids:
        return {}

    unique_ids = [pid.strip() for pid in playlist_ids if pid and pid.strip()][:50]
    if not unique_ids:
        return {}

    url = "https://www.googleapis.com/youtube/v3/playlists"
    params = {
        "part": "snippet,contentDetails",
        "id": ",".join(unique_ids),
        "key": api_key,
    }

    results = {}
    try:
        with httpx.Client() as client:
            response = client.get(url, params=params, timeout=12.0)
            if response.status_code == 200:
                items = response.json().get("items", [])
                for item in items:
                    p_id = item.get("id")
                    if not p_id:
                        continue
                    snippet = item.get("snippet", {})
                    content_details = item.get("contentDetails", {})
                    results[p_id] = {
                        "title": snippet.get("title", ""),
                        "channel": snippet.get("channelTitle", ""),
                        "channelId": snippet.get("channelId", ""),
                        "description": snippet.get("description", ""),
                        "thumbnail": get_best_thumbnail(snippet.get("thumbnails", {})),
                        "itemCount": content_details.get("itemCount", 0),
                        "publishedAt": snippet.get("publishedAt", ""),
                    }
    except Exception as e:
        logger.warning(f"Batch playlist details fetch failed: {e}")

    return results
