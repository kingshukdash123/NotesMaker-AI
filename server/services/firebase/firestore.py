import json
import httpx
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

async def get_user_api_keys(user_id: str, id_token: str = None) -> tuple[str | None, str | None]:
    """
    Fetches Google and Groq API keys for a specific user from Firestore.
    
    Args:
        user_id: The Firebase UID of the user.
        id_token: The Firebase Auth ID token (optional, but recommended if Firestore rules are enabled).
        
    Returns:
        A tuple of (google_api_key, groq_api_key).
    """
    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        logger.warning("FIREBASE_PROJECT_ID is not configured in server settings. Cannot fetch keys from Firestore.")
        return None, None
        
    # Firestore REST API URL for document: user_api_keys/{user_id}
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/user_api_keys/{user_id}"
    
    headers = {}
    if id_token:
        headers["Authorization"] = f"Bearer {id_token}"
        
    try:
        logger.info("Fetching user API keys from Firestore REST API for user %s", user_id)
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                doc_data = response.json()
                fields = doc_data.get("fields", {})
                google_key = fields.get("googleApiKey", {}).get("stringValue")
                groq_key = fields.get("groqApiKey", {}).get("stringValue")
                return google_key, groq_key
            else:
                logger.error(
                    "Failed to fetch user API keys from Firestore. Status: %d, Response: %s",
                    response.status_code,
                    response.text
                )
                return None, None
    except Exception as e:
        logger.exception("Error calling Firestore REST API for user %s", user_id)
        return None, None


def get_cached_transcript(video_id: str) -> list | None:
    """
    Checks Firestore for a cached transcript of the given video_id.
    """
    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        logger.warning("FIREBASE_PROJECT_ID is not configured. Skipping Firestore cache check.")
        return None

    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/transcripts/{video_id}"
    try:
        logger.info("Checking Firestore cache for transcript of video: %s", video_id)
        with httpx.Client() as client:
            response = client.get(url, timeout=10.0)
            if response.status_code == 200:
                doc_data = response.json()
                fields = doc_data.get("fields", {})
                transcript_json = fields.get("transcript_json", {}).get("stringValue")
                if transcript_json:
                    transcript = json.loads(transcript_json)
                    logger.info("Successfully retrieved cached transcript for video %s from Firestore.", video_id)
                    return transcript
            elif response.status_code == 404:
                logger.info("No cached transcript found in Firestore for video %s.", video_id)
            else:
                logger.error("Failed to check Firestore cache. Status: %d, Response: %s", response.status_code, response.text)
    except Exception as e:
        logger.exception("Error checking Firestore cache for video %s", video_id)
    return None


def save_cached_transcript(video_id: str, transcript: list) -> None:
    """
    Saves a transcript to Firestore transcripts collection.
    """
    import json
    project_id = getattr(settings, "FIREBASE_PROJECT_ID", None)
    if not project_id:
        logger.warning("FIREBASE_PROJECT_ID is not configured. Cannot save transcript cache.")
        return

    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/transcripts/{video_id}"
    
    # Construct request payload for PATCH
    payload = {
        "fields": {
            "video_id": {"stringValue": video_id},
            "transcript_json": {"stringValue": json.dumps(transcript)},
        }
    }
    
    try:
        logger.info("Saving transcript to Firestore cache for video: %s", video_id)
        with httpx.Client() as client:
            # PATCH creates or overwrites the document at transcripts/{video_id}
            response = client.patch(url, json=payload, timeout=15.0)
            if response.status_code == 200:
                logger.info("Successfully cached transcript for video %s in Firestore transcripts collection.", video_id)
            else:
                logger.error("Failed to save transcript to Firestore. Status: %d, Response: %s", response.status_code, response.text)
    except Exception as e:
        logger.exception("Error saving transcript cache to Firestore for video %s", video_id)
