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
            # Parse user-supplied Gemini keys (comma separated)
            google_keys = []
            if google_api_key:
                google_keys = [k.strip() for k in google_api_key.split(",") if k.strip()]

            # If no user-provided keys, fall back to environment variables
            if not google_keys:
                env_keys = os.getenv("GEMINI_API_KEYS")
                if env_keys:
                    google_keys = [k.strip() for k in env_keys.split(",") if k.strip()]
                else:
                    for var_name in ["GEMINI_API_KEY", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3"]:
                        val = os.getenv(var_name)
                        if val:
                            google_keys.append(val.strip())

            if not google_keys:
                logger.error("API key is missing.")
                raise NotesMakerError(
                    message="API key is missing. Please set it in Settings.",
                    code="MISSING_API_KEY",
                    status_code=400,
                )

            logger.info("Initializing key rotation with %d key(s).", len(google_keys))

            primary_llms = []
            for key in google_keys:
                primary_llms.append(
                    ChatGoogleGenerativeAI(
                        model="gemini-3.5-flash-lite",
                        google_api_key=key,
                        temperature=0.2,
                        max_retries=0, # Fail fast on rate limits to rotate keys instantly
                    )
                )

            # Build the LangChain fallback chain
            if len(primary_llms) == 1:
                final_llm = primary_llms[0]
            else:
                final_llm = primary_llms[0].with_fallbacks(primary_llms[1:])

            return final_llm

        except Exception as e:
            if isinstance(e, NotesMakerError):
                raise e
            logger.exception("Failed to initialize LLMs.")
            raise NotesMakerError(
                message="Failed to initialize language models due to a configuration or credential issue.",
                code="LLM_INITIALIZATION_ERROR",
                status_code=500,
            ) from e