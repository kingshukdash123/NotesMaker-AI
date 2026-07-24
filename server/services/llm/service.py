from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

from utils.exceptions import NotesMakerError
from utils.logger import get_logger
from config.settings import settings

logger = get_logger(__name__)


class LLMService:

    @classmethod
    def get_llm(cls, google_api_key: Optional[str] = None, groq_api_key: Optional[str] = None):
        """
        Dynamically initializes and returns the LLM chain.
        Primary: ChatGoogleGenerativeAI (Gemini)
        Secondary/Fallback: ChatGroq (Llama)
        """
        try:
            # User must supply both API keys through the request
            pass

            if not google_api_key:
                logger.error("Google Gemini API key is missing.")
                raise NotesMakerError(
                    message="Google Gemini API key is missing. Please set it in Settings.",
                    code="MISSING_GEMINI_API_KEY",
                    status_code=400,
                )

            if not groq_api_key:
                logger.error("Groq API key is missing.")
                raise NotesMakerError(
                    message="Groq API key is missing. Please set it in Settings.",
                    code="MISSING_GROQ_API_KEY",
                    status_code=400,
                )

            logger.info("Initializing Google Gemini as primary and Groq as fallback LLM.")

            primary_llm = ChatGoogleGenerativeAI(
                model="gemini-3.5-flash-lite",
                google_api_key=google_api_key,
                temperature=0.2,
            )

            fallback_llm = ChatGroq(
                model="llama-3.1-8b-instant",
                api_key=groq_api_key,
                temperature=0.2,
            )

            return primary_llm.with_fallbacks([fallback_llm])

        except Exception as e:
            if isinstance(e, NotesMakerError):
                raise e
            logger.exception("Failed to initialize LLMs.")
            raise NotesMakerError(
                message=f"Failed to initialize language models: {str(e)}",
                code="LLM_INITIALIZATION_ERROR",
                status_code=500,
            ) from e