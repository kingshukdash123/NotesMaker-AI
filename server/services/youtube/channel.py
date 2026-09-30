import re
from typing import Optional, Dict, Any, List
import httpx

from config.settings import settings
from utils.exceptions import PathshalaError
from utils.logger import get_logger
from services.youtube.metadata import get_best_thumbnail
from services.youtube.playlist import get_youtube_playlist_items

logger = get_logger(__name__)


def derive_uploads_playlist_id(channel_id: str) -> str:
    """
    Derives the master YouTube uploads playlist ID from a channel ID.
    YouTube assigns every channel an uploads playlist starting with 'UU' instead of 'UC'.
    """
    clean_id = (channel_id or "").strip()
    if clean_id.startswith("UC") and len(clean_id) >= 24:
        return "UU" + clean_id[2:]
    return clean_id


async def get_youtube_channel_profile(channel_id: str) -> Dict[str, Any]:
    """
    Fetch student-focused channel profile information using YouTube Data API v3 channels endpoint.
    Consumes only 1 quota unit.
    """
    api_key = (settings.YOUTUBE_API_KEY or "").strip()
    if not api_key:
        logger.error("YOUTUBE_API_KEY not configured in settings.")
        raise PathshalaError(
            message="YouTube API Key is missing. Please configure YOUTUBE_API_KEY in server environment.",
            code="YOUTUBE_KEY_MISSING",
            status_code=500
        )

    clean_id = channel_id.strip() if isinstance(channel_id, str) else str(channel_id)
    if not clean_id:
        raise PathshalaError(
            message="Channel ID or name is required.",
            code="INVALID_CHANNEL_ID",
            status_code=400
        )

    logger.info(f"Fetching official YouTube channel profile for query='{clean_id}'")

    url = "https://www.googleapis.com/youtube/v3/channels"
    params = {
        "part": "snippet,contentDetails",
        "key": api_key
    }

    if clean_id.startswith("@"):
        params["forHandle"] = clean_id
    elif clean_id.startswith("UC") and len(clean_id) >= 20:
        params["id"] = clean_id
    else:
        # If passed as a custom name or handle without @, try forHandle first
        params["forHandle"] = f"@{clean_id.replace(' ', '')}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=12.0)
            items = []
            if response.status_code == 200:
                items = response.json().get("items", [])

            # If not resolved via forHandle or direct id, search for the channel by title
            fallback_thumb = ""
            fallback_title = ""
            if not items and not (clean_id.startswith("UC") and len(clean_id) >= 20):
                logger.info(f"Channel not found via handle, searching YouTube for channel title: '{clean_id}'")
                search_url = "https://www.googleapis.com/youtube/v3/search"
                search_params = {
                    "part": "snippet",
                    "type": "channel",
                    "q": clean_id,
                    "maxResults": 1,
                    "key": api_key
                }
                search_res = await client.get(search_url, params=search_params, timeout=12.0)
                if search_res.status_code == 200:
                    s_items = search_res.json().get("items", [])
                    if s_items:
                        s_snippet = s_items[0].get("snippet", {})
                        found_channel_id = s_items[0].get("id", {}).get("channelId") or s_snippet.get("channelId")
                        fallback_thumb = get_best_thumbnail(s_snippet.get("thumbnails", {}))
                        fallback_title = s_snippet.get("title", clean_id)
                        if found_channel_id:
                            # Now fetch full channel profile using the resolved channelId
                            ch_res = await client.get(url, params={"part": "snippet,contentDetails", "id": found_channel_id, "key": api_key}, timeout=12.0)
                            if ch_res.status_code == 200:
                                items = ch_res.json().get("items", [])

            if not items:
                # If lookup returned empty, return fallback minimal profile
                logger.warning(f"No channel found for query='{clean_id}'")
                res_id = found_channel_id if ('found_channel_id' in locals() and found_channel_id) else clean_id
                return {
                    "channelId": res_id,
                    "title": fallback_title or (clean_id if not clean_id.startswith("UC") else "YouTube Creator"),
                    "description": "",
                    "thumbnail": fallback_thumb or "",
                    "customUrl": "",
                    "youtubeUrl": f"https://www.youtube.com/channel/{res_id}" if res_id.startswith("UC") else f"https://www.youtube.com/results?search_query={clean_id}",
                    "uploadsPlaylistId": derive_uploads_playlist_id(res_id),
                }

            item = items[0]
            resolved_channel_id = item.get("id", clean_id)
            snippet = item.get("snippet", {})
            content_details = item.get("contentDetails", {})

            # Resolve uploads playlist ID (contentDetails.relatedPlaylists.uploads or UU...)
            related_playlists = content_details.get("relatedPlaylists", {})
            uploads_playlist_id = related_playlists.get("uploads") or derive_uploads_playlist_id(resolved_channel_id)

            custom_url = snippet.get("customUrl", "")
            if custom_url:
                custom_url_clean = custom_url if custom_url.startswith("@") else f"@{custom_url}"
                youtube_url = f"https://www.youtube.com/{custom_url_clean}"
            else:
                youtube_url = f"https://www.youtube.com/channel/{resolved_channel_id}"

            thumbnails = snippet.get("thumbnails", {})
            thumb_url = get_best_thumbnail(thumbnails)

            return {
                "channelId": resolved_channel_id,
                "title": snippet.get("title", "YouTube Creator"),
                "description": snippet.get("description", ""),
                "thumbnail": thumb_url,
                "customUrl": custom_url,
                "youtubeUrl": youtube_url,
                "uploadsPlaylistId": uploads_playlist_id,
            }

    except PathshalaError:
        raise
    except httpx.HTTPError as he:
        logger.exception("HTTP error querying YouTube Channels API.")
        raise PathshalaError(
            message=f"Network error querying YouTube channel: {str(he)}",
            code="YOUTUBE_NETWORK_ERROR",
            status_code=502
        )
    except Exception as e:
        logger.exception("Unexpected error fetching channel profile.")
        raise PathshalaError(
            message=f"Unexpected error loading channel: {str(e)}",
            code="CHANNEL_UNKNOWN_ERROR",
            status_code=500
        )


async def get_youtube_channel_playlists(channel_id: str, page_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch public course playlists created by the given YouTube channel.
    Consumes only 1 quota unit per page of 50 playlists.
    """
    api_key = (settings.YOUTUBE_API_KEY or "").strip()
    if not api_key:
        logger.error("YOUTUBE_API_KEY not configured in settings.")
        raise PathshalaError(
            message="YouTube API Key is missing. Please configure YOUTUBE_API_KEY in server environment.",
            code="YOUTUBE_KEY_MISSING",
            status_code=500
        )

    clean_id = channel_id.strip() if isinstance(channel_id, str) else str(channel_id)
    if not clean_id:
        raise PathshalaError(
            message="Channel ID is required.",
            code="INVALID_CHANNEL_ID",
            status_code=400
        )

    # If passed as channel name or handle, resolve real UC... ID first
    resolved_id = clean_id
    if not (clean_id.startswith("UC") and len(clean_id) >= 20):
        try:
            profile = await get_youtube_channel_profile(clean_id)
            if profile.get("channelId") and profile["channelId"].startswith("UC"):
                resolved_id = profile["channelId"]
        except Exception as res_err:
            logger.warning(f"Could not resolve channel ID for playlists from '{clean_id}': {res_err}")

    clean_token = page_token.strip() if page_token and page_token.strip() else None

    logger.info(f"Fetching official YouTube channel playlists for channel_id='{resolved_id}', page_token={clean_token}")

    url = "https://www.googleapis.com/youtube/v3/playlists"
    params = {
        "part": "snippet,contentDetails",
        "channelId": resolved_id,
        "maxResults": 50,
        "key": api_key
    }
    if clean_token:
        params["pageToken"] = clean_token

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=12.0)

            if response.status_code != 200:
                error_msg = response.text
                error_code = "PLAYLISTS_FETCH_ERROR"
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
                logger.error(f"YouTube playlists API returned status {response.status_code}: {error_msg}")
                raise PathshalaError(
                    message=f"Could not load channel playlists: {error_msg}",
                    code=error_code,
                    status_code=response.status_code
                )

            data = response.json()
            items = []
            for item in data.get("items", []):
                snippet = item.get("snippet", {})
                content_details = item.get("contentDetails", {})
                p_id = item.get("id")
                if not p_id:
                    continue

                thumbnails = snippet.get("thumbnails", {})
                thumb_url = get_best_thumbnail(thumbnails)

                items.append({
                    "id": p_id,
                    "playlistId": p_id,
                    "title": snippet.get("title", "Course Playlist"),
                    "channel": snippet.get("channelTitle", "YouTube Creator"),
                    "channelId": snippet.get("channelId", resolved_id),
                    "description": snippet.get("description", ""),
                    "thumbnail": thumb_url,
                    "itemCount": content_details.get("itemCount", 0),
                    "publishedAt": snippet.get("publishedAt", ""),
                })

            return {
                "channelId": resolved_id,
                "items": items,
                "nextPageToken": data.get("nextPageToken"),
                "totalResults": data.get("pageInfo", {}).get("totalResults", len(items)),
            }

    except PathshalaError:
        raise
    except httpx.HTTPError as he:
        logger.exception("HTTP error querying YouTube Channel Playlists API.")
        raise PathshalaError(
            message=f"Network error querying channel playlists: {str(he)}",
            code="YOUTUBE_NETWORK_ERROR",
            status_code=502
        )
    except Exception as e:
        logger.exception("Unexpected error fetching channel playlists.")
        raise PathshalaError(
            message=f"Unexpected error loading channel playlists: {str(e)}",
            code="CHANNEL_PLAYLISTS_ERROR",
            status_code=500
        )


async def get_youtube_channel_videos(channel_id: str, page_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch public uploads/videos published by the channel using the uploads playlist (UU...).
    Consumes only 1-2 quota units per page of 50 videos (saves 99% quota compared to search.list).
    """
    clean_id = (channel_id or "").strip()
    uploads_playlist_id = derive_uploads_playlist_id(clean_id)

    # If clean_id is not a UC... or UU... ID, resolve it via channel profile
    if not (clean_id.startswith("UC") or clean_id.startswith("UU")):
        try:
            profile = await get_youtube_channel_profile(clean_id)
            if profile.get("uploadsPlaylistId"):
                uploads_playlist_id = profile["uploadsPlaylistId"]
                clean_id = profile.get("channelId", clean_id)
        except Exception as res_err:
            logger.warning(f"Could not resolve uploads playlist for '{clean_id}': {res_err}")

    playlist_data = await get_youtube_playlist_items(uploads_playlist_id, page_token=page_token)
    return {
        "channelId": clean_id,
        "uploadsPlaylistId": uploads_playlist_id,
        "videos": playlist_data.get("videos", []),
        "nextPageToken": playlist_data.get("nextPageToken"),
        "totalResults": playlist_data.get("totalResults", len(playlist_data.get("videos", []))),
    }
