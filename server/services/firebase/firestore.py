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
