from langchain_groq import ChatGroq

from server.exceptions import NotesMakerError
from server.logger import get_logger
from server.config.settings import settings

logger = get_logger(__name__)


class LLMService:

    _llm = None

    @classmethod
    def get_llm(cls):

        try:
            if cls._llm is None:
                logger.info(
                    "Initializing Groq LLM (model=%s).",
                    settings.GROQ_MODEL,
                )

                primary_llm = ChatGroq(
                    model=settings.GROQ_MODEL,
                    api_key=settings.GROQ_API_KEY,
                    temperature=0.2,
                )

                # Fallback model to handle rate limit / quota exceptions
                fallback_llm = ChatGroq(
                    model="llama-3.3-70b-versatile",
                    api_key=settings.GROQ_API_KEY,
                    temperature=0.2,
                )

                cls._llm = primary_llm.with_fallbacks([fallback_llm])

                logger.info("Groq LLM initialized successfully.")

            else:
                logger.info("Using existing Groq LLM instance.")

            return cls._llm

        except Exception as e:
            logger.exception("Failed to initialize Groq LLM.")

            raise NotesMakerError(
                message="Failed to initialize Groq language model.",
                code="LLM_INITIALIZATION_ERROR",
                status_code=500,
            ) from e