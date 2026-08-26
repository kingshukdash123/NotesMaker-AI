import os
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI

from utils.exceptions import NotesMakerError
from utils.logger import get_logger
from config.settings import settings

logger = get_logger(__name__)


class LLMService:

    @classmethod
    def get_llm(cls, google_api_key: Optional[str] = None):
        """
        Dynamically initializes and returns the LLM chain.
        Primary: ChatGoogleGenerativeAI (Gemini) with multiple key rotation.
        """
        try:
            # If no user-provided key, fall back to environment variables
            if not google_api_key:
                google_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY_1")

            if not google_api_key:
                logger.error("API key is missing.")
                raise NotesMakerError(
                    message="API key is missing. Please set it in Settings.",
                    code="MISSING_API_KEY",
                    status_code=400,
                )

            logger.info("Initializing Gemini model with a single API key.")

            return ChatGoogleGenerativeAI(
                model="gemini-3.5-flash-lite",
                google_api_key=google_api_key.strip(),
                temperature=0.2,
                max_retries=3,
            )

        except Exception as e:
            if isinstance(e, NotesMakerError):
                raise e
            logger.exception("Failed to initialize LLMs.")
            raise NotesMakerError(
                message="Failed to initialize language models due to a configuration or credential issue.",
                code="LLM_INITIALIZATION_ERROR",
                status_code=500,
            ) from e