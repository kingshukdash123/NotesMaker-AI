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
