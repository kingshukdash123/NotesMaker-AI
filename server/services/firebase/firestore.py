import base64
import gzip
import json
import httpx
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

async def get_user_api_keys(user_id: str, id_token: str = None) -> dict:
    """
    Fetches the Google API key and Groq API key for a specific user from Firestore.
    
    Args:
        user_id: The Firebase UID of the user.
        id_token: The Firebase Auth ID token (optional, but recommended if Firestore rules are enabled).
        
    Returns:
        A dictionary containing "google_api_key" and "groq_api_key" (values can be str or None).
    """
    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    keys = {"google_api_key": None, "groq_api_key": None}
    if not project_id:
        logger.warning("Database configuration missing. Cannot fetch user keys.")
        return keys
        
    # Firestore REST API URL for document: user_api_keys/{user_id}
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/user_api_keys/{user_id}"
    
    headers = {}
    if id_token:
        headers["Authorization"] = f"Bearer {id_token}"
        
    try:
        logger.info("Retrieving user keys.")
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                doc_data = response.json()
                fields = doc_data.get("fields", {})
                keys["google_api_key"] = fields.get("googleApiKey", {}).get("stringValue")
                keys["groq_api_key"] = fields.get("groqApiKey", {}).get("stringValue")
                return keys
            else:
                logger.error("Failed to fetch user keys.")
                return keys
    except Exception as e:
        logger.exception("Error retrieving user keys.")
        return keys



def get_cached_transcript(video_id: str) -> list | None:
    """
    Checks Firestore for a cached transcript of the given video_id.
    Supports both legacy raw JSON and compressed base64+gzip strings.
    """
    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        logger.warning("Database configuration missing. Skipping cache check.")
        return None

    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/transcripts/{video_id}"
    try:
        logger.info("Checking cache for transcript.")
        with httpx.Client() as client:
            response = client.get(url, timeout=10.0)
            if response.status_code == 200:
                doc_data = response.json()
                fields = doc_data.get("fields", {})
                transcript_json = fields.get("transcript_json", {}).get("stringValue")
                if transcript_json:
                    try:
                        # 1. Try parsing as raw JSON (backward compatibility)
                        transcript = json.loads(transcript_json)
                    except json.JSONDecodeError:
                        # 2. If that fails, assume it is base64-encoded, gzipped data
                        try:
                            compressed_data = base64.b64decode(transcript_json)
                            decompressed_data = gzip.decompress(compressed_data)
                            transcript = json.loads(decompressed_data.decode("utf-8"))
                        except Exception as decompress_err:
                            logger.exception("Failed to decompress cached transcript.")
                            return None
                    
                    logger.info("Successfully retrieved cached transcript.")
                    return transcript
            elif response.status_code == 404:
                logger.info("No cached transcript found.")
            else:
                logger.error("Failed to check cache.")
    except Exception as e:
        logger.exception("Error checking cache.")
    return None


def save_cached_transcript(video_id: str, transcript: list) -> None:
    """
    Saves a transcript to Firestore transcripts collection.
    Compresses it using base64+gzip to stay under the 1MB Firestore document limit.
    """
    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        logger.warning("Database configuration missing. Cannot save cache.")
        return

    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/transcripts/{video_id}"
    
    try:
        logger.info("Saving transcript to cache.")
        
        # Compress the transcript JSON using gzip + base64 to save space
        json_str = json.dumps(transcript)
        compressed_data = gzip.compress(json_str.encode("utf-8"))
        base64_str = base64.b64encode(compressed_data).decode("utf-8")
        
        # Construct request payload
        payload = {
            "fields": {
                "video_id": {"stringValue": video_id},
                "transcript_json": {"stringValue": base64_str},
            }
        }
        
        with httpx.Client() as client:
            # PATCH creates or overwrites the document at transcripts/{video_id}
            response = client.patch(url, json=payload, timeout=15.0)
            if response.status_code == 200:
                logger.info("Successfully saved transcript to cache.")
            else:
                logger.error("Failed to save transcript to cache.")
    except Exception as e:
        logger.exception("Error saving transcript to cache.")


import datetime

async def get_cached_search(query_hash: str) -> dict | None:
    """
    Checks Firestore for a cached search result matching the query hash.
    Validates that the cache is under 1 hour old.
    """
    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        logger.warning("Database configuration missing. Skipping search cache check.")
        return None

    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/search_cache/{query_hash}"
    try:
        logger.info(f"Checking search cache for query_hash: {query_hash}")
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                doc_data = response.json()
                fields = doc_data.get("fields", {})
                
                # Check expiration (1 hour)
                cached_at_str = fields.get("cachedAt", {}).get("timestampValue")
                if not cached_at_str:
                    return None
                    
                cached_at = datetime.datetime.fromisoformat(cached_at_str.replace("Z", "+00:00"))
                now = datetime.datetime.now(datetime.timezone.utc)
                age = (now - cached_at).total_seconds()
                
                if age > 3600:
                    logger.info(f"Search cache for hash {query_hash} is expired (age={age}s).")
                    return None
                
                results_json = fields.get("results_json", {}).get("stringValue")
                results = json.loads(results_json) if results_json else []
                next_page_token = fields.get("nextPageToken", {}).get("stringValue") or None
                
                logger.info(f"Search cache hit for hash {query_hash} (age={age}s).")
                return {
                    "items": results,
                    "nextPageToken": next_page_token,
                    "cached": True
                }
            elif response.status_code == 404:
                logger.info(f"Search cache miss for hash {query_hash}")
            else:
                logger.error(f"Search cache check failed with status {response.status_code}")
    except Exception as e:
        logger.exception("Error checking search cache.")
    return None


async def save_cached_search(query_hash: str, query: str, category: str, results: list, next_page_token: str = None) -> None:
    """
    Caches search results in Firestore under search_cache collection.
    Saves results serialized as a JSON string to avoid schema limits.
    """
    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        logger.warning("Database configuration missing. Cannot save search cache.")
        return

    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/search_cache/{query_hash}"
    
    try:
        logger.info(f"Caching search results for query_hash: {query_hash}")
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
        
        payload = {
            "fields": {
                "query": {"stringValue": query},
                "category": {"stringValue": category},
                "results_json": {"stringValue": json.dumps(results)},
                "nextPageToken": {"stringValue": next_page_token or ""},
                "cachedAt": {"timestampValue": now_str}
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(url, json=payload, timeout=10.0)
            if response.status_code == 200:
                logger.info(f"Successfully cached search results for hash {query_hash}")
            else:
                logger.error(f"Failed to cache search results: {response.text}")
    except Exception as e:
        logger.exception("Error saving search results to cache.")

