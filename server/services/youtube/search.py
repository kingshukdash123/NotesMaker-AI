import httpx
from config.settings import settings
from utils.exceptions import PathshalaError
from utils.logger import get_logger

logger = get_logger(__name__)

async def search_youtube_videos(query: str, category: str = "all", page_token: str = None, content_type: str = "all"):
    """
    Search YouTube videos and playlists using the official YouTube Data API v3.
    Supports multi-type search:
    - content_type="all": returns standard videos, course playlists, and live streams
    - content_type="video": returns standard and archived lecture videos
    - content_type="playlist": returns courses / playlists
    - content_type="live": returns active and completed live broadcasts
    """
    api_key = settings.YOUTUBE_API_KEY
    if not api_key:
        logger.error("YOUTUBE_API_KEY not configured in settings.")
        raise PathshalaError(
            message="YouTube API Key is missing. Please configure YOUTUBE_API_KEY in the server environment.",
            code="YOUTUBE_KEY_MISSING",
            status_code=500
        )

    # Determine type parameter
    # YouTube Data API supports comma-separated list of types: "video,playlist"
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
    if type_param == "video":
        params["videoEmbeddable"] = "true"

    # Category filtering: only apply when explicitly specified (avoiding drops of STEM lectures under category 'all')
    cat_lower = category.lower().strip()
    if cat_lower not in ["all", "", "any"]:
        if cat_lower in ["science", "engineering", "physics", "chemistry", "computer science", "tech"]:
            params["videoCategoryId"] = "28"  # Science & Technology
        elif cat_lower in ["education", "academic", "course", "lecture"]:
            params["videoCategoryId"] = "27"  # Education

    if event_type:
        params["eventType"] = event_type

    if page_token:
        params["pageToken"] = page_token

    logger.info(f"Querying YouTube Search API for query='{query}', type='{type_param}', category='{category}', pageToken={page_token}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=15.0)
            
            if response.status_code != 200:
                error_msg = response.text
                try:
                    err_json = response.json()
                    error_msg = err_json.get("error", {}).get("message", error_msg)
                except Exception:
                    pass
                logger.error(f"YouTube search API returned status {response.status_code}: {error_msg}")
                raise PathshalaError(
                    message=f"YouTube Search API error: {error_msg}",
                    code="YOUTUBE_API_ERROR",
                    status_code=response.status_code
                )
                
            data = response.json()
            items = []
            
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
                thumb_url = (
                    thumbnails.get("high", {}).get("url") or 
                    thumbnails.get("medium", {}).get("url") or 
                    thumbnails.get("default", {}).get("url") or 
                    (f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg" if video_id else "")
                )

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
                
                items.append({
                    "id": item_id,
                    "videoId": video_id or "",
                    "playlistId": playlist_id or "",
                    "mediaType": media_type,
                    "isLive": is_live,
                    "title": snippet.get("title", "Educational Content"),
                    "channel": snippet.get("channelTitle", "YouTube Creator"),
                    "thumbnail": thumb_url,
                    "description": snippet.get("description", ""),
                    "publishedAt": snippet.get("publishedAt", "")
                })
                
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
        logger.exception("Unexpected error during YouTube search.")
        raise PathshalaError(
            message=f"Internal error during search: {str(e)}",
            code="SEARCH_INTERNAL_ERROR",
            status_code=500
        )
