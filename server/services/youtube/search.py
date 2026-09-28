from typing import Optional
import httpx

from config.settings import settings
from utils.exceptions import PathshalaError
from utils.logger import get_logger
from services.youtube.metadata import get_batch_video_details, get_batch_playlist_details, get_best_thumbnail

logger = get_logger(__name__)


async def search_youtube_videos(
    query: str,
    category: str = "all",
    page_token: Optional[str] = None,
    content_type: str = "all"
):
    """
    Search YouTube videos and playlists using the official YouTube Data API v3.
    Enriches video results with exact durations, view counts, high-res thumbnails,
    and full descriptions in single efficient batch calls (1 quota unit each).

    Supports multi-type search:
    - content_type="all": returns standard videos, course playlists, and live streams
    - content_type="video": returns standard and archived lecture videos
    - content_type="playlist": returns courses / playlists
    - content_type="live": returns active live broadcasts
    """
    api_key = (settings.YOUTUBE_API_KEY or "").strip()
    if not api_key:
        logger.error("YOUTUBE_API_KEY not configured in settings.")
        raise PathshalaError(
            message="YouTube API Key is missing. Please configure YOUTUBE_API_KEY in the server environment.",
            code="YOUTUBE_KEY_MISSING",
            status_code=500
        )

    # Determine type parameter for YouTube Data API (comma-separated list of types: "video,playlist")
    type_param = "video,playlist"
    event_type = None

    content_type_normalized = (content_type or "all").lower().strip()
    if content_type_normalized == "playlist":
        type_param = "playlist"
    elif content_type_normalized == "video":
        type_param = "video"
    elif content_type_normalized == "live":
        type_param = "video"
        event_type = "live"

    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query.strip(),
        "type": type_param,
        "safeSearch": "strict",
        "maxResults": 50,
        "key": api_key
    }

    # Only restrict videoEmbeddable if strictly searching for videos
    if type_param == "video" and not event_type:
        params["videoEmbeddable"] = "true"

    # Category filtering
    cat_lower = category.lower().strip()
    if cat_lower not in ["all", "", "any"]:
        if cat_lower in ["science", "engineering", "physics", "chemistry", "computer science", "tech"]:
            params["videoCategoryId"] = "28"  # Science & Technology
        elif cat_lower in ["education", "academic", "course", "lecture"]:
            params["videoCategoryId"] = "27"  # Education

    if event_type:
        params["eventType"] = event_type

    if page_token:
        params["pageToken"] = page_token.strip()

    logger.info(
        f"Querying YouTube Data API Search for query='{query}', type='{type_param}', "
        f"category='{category}', pageToken={page_token}"
    )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=15.0)

            if response.status_code != 200:
                error_msg = response.text
                error_code = "YOUTUBE_API_ERROR"
                try:
                    err_json = response.json()
                    errors = err_json.get("error", {}).get("errors", [])
                    if errors and errors[0].get("reason") in ("quotaExceeded", "dailyLimitExceeded"):
                        error_code = "YOUTUBE_QUOTA_EXCEEDED"
                        error_msg = "YouTube API daily quota exceeded. Please try again later or use direct video URL."
                    else:
                        error_msg = err_json.get("error", {}).get("message", error_msg)
                except Exception:
                    pass
                logger.error(f"YouTube search API returned status {response.status_code}: {error_msg}")
                raise PathshalaError(
                    message=f"YouTube Search API error: {error_msg}",
                    code=error_code,
                    status_code=response.status_code
                )

            data = response.json()
            items = []
            video_ids_to_enrich = []
            playlist_ids_to_enrich = []

            for item in data.get("items", []):
                id_obj = item.get("id", {})
                kind = id_obj.get("kind", "")
                snippet = item.get("snippet", {})
                thumbnails = snippet.get("thumbnails", {})

                # Extract video or playlist ID
                video_id = id_obj.get("videoId")
                playlist_id = id_obj.get("playlistId")

                if not video_id and not playlist_id:
                    continue

                item_id = video_id or playlist_id

                # Fetch highest quality thumbnail available
                thumb_url = get_best_thumbnail(thumbnails, video_id or "")

                # Classify media type
                live_content = snippet.get("liveBroadcastContent", "none")
                if kind == "youtube#playlist" or playlist_id:
                    media_type = "playlist"
                    is_live = False
                elif live_content == "live":
                    media_type = "live"
                    is_live = True
                elif live_content == "completed":
                    media_type = "live_archive"
                    is_live = False
                else:
                    media_type = "video"
                    is_live = False

                if video_id:
                    video_ids_to_enrich.append(video_id)
                elif playlist_id:
                    playlist_ids_to_enrich.append(playlist_id)

                items.append({
                    "id": item_id,
                    "videoId": video_id or "",
                    "playlistId": playlist_id or "",
                    "mediaType": media_type,
                    "isLive": is_live,
                    "title": snippet.get("title", "Educational Content"),
                    "channel": snippet.get("channelTitle", "YouTube Creator"),
                    "channelId": snippet.get("channelId", ""),
                    "thumbnail": thumb_url,
                    "description": snippet.get("description", ""),
                    "publishedAt": snippet.get("publishedAt", ""),
                    "duration": 0,
                    "durationFormatted": "",
                    "viewCount": "",
                })

            # Batch enrich video items with duration, statistics, and full description (1 quota unit for up to 50 videos)
            if video_ids_to_enrich:
                try:
                    enriched_details = get_batch_video_details(video_ids_to_enrich)
                    if enriched_details:
                        for entry in items:
                            vid = entry.get("videoId")
                            if vid and vid in enriched_details:
                                details = enriched_details[vid]
                                if details.get("duration"):
                                    entry["duration"] = details["duration"]
                                    entry["durationFormatted"] = details.get("durationFormatted", "")
                                if details.get("viewCount"):
                                    entry["viewCount"] = details["viewCount"]
                                if details.get("description"):
                                    entry["description"] = details["description"]
                                if details.get("thumbnail") and (not entry["thumbnail"] or "hqdefault" in entry["thumbnail"]):
                                    entry["thumbnail"] = details["thumbnail"]
                                if "isLive" in details:
                                    entry["isLive"] = details["isLive"]
                except Exception as batch_err:
                    logger.warning(f"Batch enrichment for video search items skipped: {batch_err}")

            # Batch enrich playlist items with full descriptions and high-res thumbnails (1 quota unit for up to 50 playlists)
            if playlist_ids_to_enrich:
                try:
                    enriched_playlists = get_batch_playlist_details(playlist_ids_to_enrich)
                    if enriched_playlists:
                        for entry in items:
                            pid = entry.get("playlistId")
                            if pid and pid in enriched_playlists:
                                p_details = enriched_playlists[pid]
                                if p_details.get("description"):
                                    entry["description"] = p_details["description"]
                                if p_details.get("thumbnail") and not entry.get("thumbnail"):
                                    entry["thumbnail"] = p_details["thumbnail"]
                                if p_details.get("itemCount"):
                                    entry["itemCount"] = p_details["itemCount"]
                except Exception as p_err:
                    logger.warning(f"Batch enrichment for playlist search items skipped: {p_err}")

            return {
                "items": items,
                "nextPageToken": data.get("nextPageToken")
            }

    except httpx.HTTPError as he:
        logger.exception("HTTP error querying YouTube Search API.")
        raise PathshalaError(
            message=f"Network error querying YouTube API: {str(he)}",
            code="YOUTUBE_NETWORK_ERROR",
            status_code=503
        )
    except Exception as e:
        if isinstance(e, PathshalaError):
            raise e
        logger.exception("Unexpected error during YouTube search.")
        raise PathshalaError(
            message=f"Internal error during search: {str(e)}",
            code="SEARCH_INTERNAL_ERROR",
            status_code=500
        )

