import httpx
from config.settings import settings
from utils.exceptions import PathshalaError
from utils.logger import get_logger

logger = get_logger(__name__)

async def search_youtube_videos(query: str, category: str = "all", page_token: str = None):
    """
    Search YouTube videos using the official YouTube Data API v3.
    Filters content using category IDs (27 for Education, 28 for Science/Tech)
    and restricts search to embeddable videos with strict safeSearch.
    """
    api_key = settings.YOUTUBE_API_KEY
    if not api_key:
        logger.error("YOUTUBE_API_KEY not configured in settings.")
        raise PathshalaError(
            message="YouTube API Key is missing. Please configure YOUTUBE_API_KEY in the server environment.",
            code="YOUTUBE_KEY_MISSING",
            status_code=500
        )

    # Determine category filtering
    # 27: Education
    # 28: Science & Technology
    category_id = "27"
    if category.lower() in ["science", "engineering", "physics", "chemistry", "computer science"]:
        category_id = "28"

    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "videoCategoryId": category_id,
        "safeSearch": "strict",
        "videoEmbeddable": "true",
        "maxResults": 50,
        "key": api_key
    }

    if page_token:
        params["pageToken"] = page_token

    logger.info(f"Querying YouTube Search API for query='{query}', category_id={category_id}, pageToken={page_token}")
    
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
                video_id = item.get("id", {}).get("videoId")
                if not video_id:
                    continue
                
                snippet = item.get("snippet", {})
                thumbnails = snippet.get("thumbnails", {})
                
                # Fetch highest quality thumbnail available
                thumb_url = (
                    thumbnails.get("high", {}).get("url") or 
                    thumbnails.get("medium", {}).get("url") or 
                    thumbnails.get("default", {}).get("url") or 
                    f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                )
                
                items.append({
                    "videoId": video_id,
                    "title": snippet.get("title", "YouTube Lecture"),
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
