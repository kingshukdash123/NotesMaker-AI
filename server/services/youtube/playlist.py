from typing import Optional, List, Dict
import httpx

from config.settings import settings
from utils.exceptions import PathshalaError
from utils.logger import get_logger
from services.youtube.validator import extract_playlist_id
from services.youtube.metadata import get_batch_video_details, get_best_thumbnail

logger = get_logger(__name__)


async def _fetch_playlist_metadata(client: httpx.AsyncClient, playlist_id: str, api_key: str) -> dict:
    """
    Fetch playlist summary metadata (title, channel, total video count, description, thumbnail)
    using the official YouTube Data API v3 playlists endpoint.
    """
    try:
        p_url = "https://www.googleapis.com/youtube/v3/playlists"
        p_params = {
            "part": "snippet,contentDetails,status",
            "id": playlist_id,
            "key": api_key
        }
        p_res = await client.get(p_url, params=p_params, timeout=10.0)
        if p_res.status_code == 200:
            p_items = p_res.json().get("items", [])
            if p_items:
                item = p_items[0]
                p_snippet = item.get("snippet", {})
                p_content = item.get("contentDetails", {})
                return {
                    "title": p_snippet.get("title", ""),
                    "channel": p_snippet.get("channelTitle", ""),
                    "channelId": p_snippet.get("channelId", ""),
                    "description": p_snippet.get("description", ""),
                    "thumbnail": get_best_thumbnail(p_snippet.get("thumbnails", {})),
                    "itemCount": p_content.get("itemCount", 0),
                }
    except Exception as pe:
        logger.warning(f"Could not fetch playlist metadata for {playlist_id}: {pe}")
    return {}


async def get_youtube_playlist_items(playlist_id: str, page_token: Optional[str] = None) -> dict:
    """
    Fetch videos inside a YouTube playlist using the official YouTube Data API v3 playlistItems.
    Supports playlist URLs or raw IDs.
    Enriches video items with exact durations and statistics using batch video details.
    Supports pagination via page_token.
    """
    api_key = (settings.YOUTUBE_API_KEY or "").strip()
    if not api_key:
        logger.error("YOUTUBE_API_KEY not configured in settings.")
        raise PathshalaError(
            message="YouTube API Key is missing. Please configure YOUTUBE_API_KEY in server environment.",
            code="YOUTUBE_KEY_MISSING",
            status_code=500
        )

    # Extract clean playlist ID even if a full URL was provided
    clean_playlist_id = extract_playlist_id(playlist_id)
    clean_token = page_token.strip() if page_token and page_token.strip() else None

    logger.info(f"Fetching official YouTube playlist items for playlist_id='{clean_playlist_id}', page_token={clean_token}")

    url = "https://www.googleapis.com/youtube/v3/playlistItems"
    params = {
        "part": "snippet,contentDetails,status",
        "playlistId": clean_playlist_id,
        "maxResults": 50,
        "key": api_key
    }
    if clean_token:
        params["pageToken"] = clean_token

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=15.0)

            if response.status_code != 200:
                error_msg = response.text
                error_code = "PLAYLIST_FETCH_ERROR"
                try:
                    err_json = response.json()
                    errors = err_json.get("error", {}).get("errors", [])
                    if errors and errors[0].get("reason") in ("quotaExceeded", "dailyLimitExceeded"):
                        error_code = "YOUTUBE_QUOTA_EXCEEDED"
                        error_msg = "YouTube API daily quota exceeded. Please try again later."
                    else:
                        error_msg = err_json.get("error", {}).get("message", error_msg)
                except Exception:
                    pass
                logger.error(f"YouTube playlistItems API returned status {response.status_code}: {error_msg}")
                raise PathshalaError(
                    message=f"Could not load playlist: {error_msg}",
                    code=error_code,
                    status_code=response.status_code
                )

            data = response.json()
            videos = []
            video_ids_to_enrich = []
            playlist_title = ""
            playlist_channel = ""

            next_page_token = data.get("nextPageToken")
            prev_page_token = data.get("prevPageToken")
            page_info = data.get("pageInfo", {})
            total_results = page_info.get("totalResults", 0)

            for item in data.get("items", []):
                snippet = item.get("snippet", {})
                content_details = item.get("contentDetails", {})
                video_id = content_details.get("videoId") or snippet.get("resourceId", {}).get("videoId")

                if not video_id:
                    continue

                # Ignore deleted or private videos
                title = snippet.get("title", "")
                if title in ("Private video", "Deleted video"):
                    continue

                if not playlist_channel:
                    playlist_channel = snippet.get("channelTitle", "")

                thumbnails = snippet.get("thumbnails", {})
                thumb_url = get_best_thumbnail(thumbnails, video_id)

                video_ids_to_enrich.append(video_id)

                videos.append({
                    "videoId": video_id,
                    "title": title,
                    "channel": snippet.get("videoOwnerChannelTitle") or snippet.get("channelTitle", "YouTube Creator"),
                    "channelId": snippet.get("videoOwnerChannelId") or snippet.get("channelId", ""),
                    "thumbnail": thumb_url,
                    "description": snippet.get("description", ""),
                    "position": snippet.get("position", len(videos)),
                    "publishedAt": snippet.get("publishedAt", ""),
                    "duration": 0,
                    "durationFormatted": "",
                })

            # Batch enrich playlist video items with duration and statistics
            if video_ids_to_enrich:
                try:
                    enriched_details = get_batch_video_details(video_ids_to_enrich)
                    if enriched_details:
                        for entry in videos:
                            vid = entry.get("videoId")
                            if vid and vid in enriched_details:
                                details = enriched_details[vid]
                                if details.get("duration"):
                                    entry["duration"] = details["duration"]
                                    entry["durationFormatted"] = details.get("durationFormatted", "")
                                if details.get("thumbnail") and (not entry["thumbnail"] or "hqdefault" in entry["thumbnail"]):
                                    entry["thumbnail"] = details["thumbnail"]
                except Exception as batch_err:
                    logger.warning(f"Batch duration enrichment for playlist items skipped: {batch_err}")

            # Fetch playlist metadata only on initial page load (saving quota on pagination)
            total_items = total_results
            playlist_desc = ""
            playlist_thumb = ""
            if not clean_token:
                meta = await _fetch_playlist_metadata(client, clean_playlist_id, api_key)
                playlist_title = meta.get("title") or playlist_title
                playlist_channel = meta.get("channel") or playlist_channel
                playlist_desc = meta.get("description", "")
                playlist_thumb = meta.get("thumbnail", "")
                total_items = meta.get("itemCount") or total_results

            return {
                "playlistId": clean_playlist_id,
                "title": playlist_title or "Course Playlist",
                "channel": playlist_channel or "YouTube Creator",
                "description": playlist_desc,
                "thumbnail": playlist_thumb or (videos[0]["thumbnail"] if videos else ""),
                "videos": videos,
                "itemCount": len(videos),
                "totalResults": total_items or len(videos),
                "nextPageToken": next_page_token,
                "prevPageToken": prev_page_token
            }

    except httpx.HTTPError as he:
        logger.exception("HTTP error querying YouTube Playlist API.")
        raise PathshalaError(
            message=f"Network error querying YouTube Playlist API: {str(he)}",
            code="PLAYLIST_NETWORK_ERROR",
            status_code=503
        )
    except Exception as e:
        if isinstance(e, PathshalaError):
            raise e
        logger.exception("Unexpected error during playlist items fetch.")
        raise PathshalaError(
            message=f"Internal error fetching playlist: {str(e)}",
            code="PLAYLIST_INTERNAL_ERROR",
            status_code=500
        )


async def get_all_youtube_playlist_items(playlist_id: str, max_videos: int = 500) -> dict:
    """
    Fetch all videos across all pages of a YouTube playlist up to max_videos.
    Preserves exact sequence of lectures from first to last.
    Enriches all video items with durations and high-res thumbnails.
    """
    api_key = (settings.YOUTUBE_API_KEY or "").strip()
    if not api_key:
        logger.error("YOUTUBE_API_KEY not configured in settings.")
        raise PathshalaError(
            message="YouTube API Key is missing. Please configure YOUTUBE_API_KEY in server environment.",
            code="YOUTUBE_KEY_MISSING",
            status_code=500
        )

    clean_playlist_id = extract_playlist_id(playlist_id)
    logger.info(f"Fetching all playlist items in sequence for playlist_id='{clean_playlist_id}'")

    url = "https://www.googleapis.com/youtube/v3/playlistItems"
    all_videos = []
    playlist_title = ""
    playlist_channel = ""
    playlist_desc = ""
    playlist_thumb = ""
    next_page_token = None
    total_items = 0

    try:
        async with httpx.AsyncClient() as client:
            # 1. Fetch playlist metadata
            meta = await _fetch_playlist_metadata(client, clean_playlist_id, api_key)
            playlist_title = meta.get("title", "")
            playlist_channel = meta.get("channel", "")
            playlist_desc = meta.get("description", "")
            playlist_thumb = meta.get("thumbnail", "")
            total_items = meta.get("itemCount", 0)

            # 2. Iterate through all pages in strict order
            page_count = 0
            while len(all_videos) < max_videos:
                page_count += 1
                params = {
                    "part": "snippet,contentDetails,status",
                    "playlistId": clean_playlist_id,
                    "maxResults": 50,
                    "key": api_key
                }
                if next_page_token:
                    params["pageToken"] = next_page_token

                response = await client.get(url, params=params, timeout=15.0)
                if response.status_code != 200:
                    error_msg = response.text
                    try:
                        err_json = response.json()
                        error_msg = err_json.get("error", {}).get("message", error_msg)
                    except Exception:
                        pass
                    if all_videos:
                        logger.warning(f"Page {page_count} error, returning {len(all_videos)} items collected so far: {error_msg}")
                        break
                    raise PathshalaError(
                        message=f"Could not load playlist: {error_msg}",
                        code="PLAYLIST_FETCH_ERROR",
                        status_code=response.status_code
                    )

                data = response.json()
                items = data.get("items", [])
                if not items:
                    break

                page_videos = []
                video_ids_to_enrich = []

                for item in items:
                    snippet = item.get("snippet", {})
                    content_details = item.get("contentDetails", {})
                    video_id = content_details.get("videoId") or snippet.get("resourceId", {}).get("videoId")
                    if not video_id:
                        continue
                    title = snippet.get("title", "")
                    if title in ("Private video", "Deleted video"):
                        continue
                    if not playlist_channel:
                        playlist_channel = snippet.get("channelTitle", "")

                    thumbnails = snippet.get("thumbnails", {})
                    thumb_url = get_best_thumbnail(thumbnails, video_id)

                    video_ids_to_enrich.append(video_id)

                    page_videos.append({
                        "videoId": video_id,
                        "title": title,
                        "channel": snippet.get("videoOwnerChannelTitle") or snippet.get("channelTitle", "YouTube Creator"),
                        "channelId": snippet.get("videoOwnerChannelId") or snippet.get("channelId", ""),
                        "thumbnail": thumb_url,
                        "description": snippet.get("description", ""),
                        "position": len(all_videos) + len(page_videos),
                        "publishedAt": snippet.get("publishedAt", ""),
                        "duration": 0,
                        "durationFormatted": "",
                    })

                # Batch enrich this page of videos with duration
                if video_ids_to_enrich:
                    try:
                        enriched_details = get_batch_video_details(video_ids_to_enrich)
                        if enriched_details:
                            for entry in page_videos:
                                vid = entry.get("videoId")
                                if vid and vid in enriched_details:
                                    details = enriched_details[vid]
                                    if details.get("duration"):
                                        entry["duration"] = details["duration"]
                                        entry["durationFormatted"] = details.get("durationFormatted", "")
                                    if details.get("thumbnail") and (not entry["thumbnail"] or "hqdefault" in entry["thumbnail"]):
                                        entry["thumbnail"] = details["thumbnail"]
                    except Exception as batch_err:
                        logger.warning(f"Batch duration enrichment failed on page {page_count}: {batch_err}")

                all_videos.extend(page_videos)

                next_page_token = data.get("nextPageToken")
                if not next_page_token:
                    break

            return {
                "playlistId": clean_playlist_id,
                "title": playlist_title or "Course Playlist",
                "channel": playlist_channel or "YouTube Creator",
                "description": playlist_desc,
                "thumbnail": playlist_thumb or (all_videos[0]["thumbnail"] if all_videos else ""),
                "videos": all_videos,
                "itemCount": len(all_videos),
                "totalResults": total_items or len(all_videos),
                "nextPageToken": None
            }

    except httpx.HTTPError as he:
        logger.exception("HTTP error querying YouTube Playlist API.")
        raise PathshalaError(
            message=f"Network error querying YouTube Playlist API: {str(he)}",
            code="PLAYLIST_NETWORK_ERROR",
            status_code=503
        )
    except Exception as e:
        if isinstance(e, PathshalaError):
            raise e
        logger.exception("Unexpected error during playlist all items fetch.")
        raise PathshalaError(
            message=f"Internal error fetching playlist: {str(e)}",
            code="PLAYLIST_INTERNAL_ERROR",
            status_code=500
        )

