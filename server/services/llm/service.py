import os
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq

from utils.exceptions import NotesMakerError
from utils.logger import get_logger
from config.settings import settings
from config.constants import EMBEDDING_MODEL, MAX_RETRIES

logger = get_logger(__name__)


class LLMService:

    @classmethod
    def get_embeddings(cls, google_api_key: Optional[str] = None, model_name: str = EMBEDDING_MODEL):
        """
        Dynamically initializes and returns the Google Generative AI Embeddings.
        """
        try:
            # If no user-provided key, fall back to environment variables
            if not google_api_key:
                google_api_key = settings.GEMINI_API_KEY



            if not google_api_key:
                logger.error("Gemini API key is missing for embeddings.")
                raise NotesMakerError(
                    message="Gemini API key is missing. Please set it in Settings.",
                    code="MISSING_API_KEY",
                    status_code=400,
                )

            logger.info(f"Initializing Gemini Embeddings model '{model_name}'.")

            return GoogleGenerativeAIEmbeddings(
                model=model_name,
                google_api_key=google_api_key.strip(),
            )

        except Exception as e:
            if isinstance(e, NotesMakerError):
                raise e
            logger.exception("Failed to initialize Gemini Embeddings.")
            raise NotesMakerError(
                message="Failed to initialize embedding models due to a configuration or credential issue.",
                code="EMBEDDING_INITIALIZATION_ERROR",
                status_code=500,
            ) from e



    @classmethod
    def get_gemini_llm(
        cls,
        google_api_key: Optional[str] = None,
        model_name: str = "gemini-3.5-flash-lite",
        temperature: float = 0.2,
        max_retries: int = MAX_RETRIES,
    ):
        """
        Dynamically initializes and returns the Gemini LLM.
        """
        try:
            # If no user-provided key, fall back to environment variables
            if not google_api_key:
                google_api_key = settings.GEMINI_API_KEY



            if not google_api_key:
                logger.error("Gemini API key is missing.")
                raise NotesMakerError(
                    message="Gemini API key is missing. Please set it in Settings.",
                    code="MISSING_API_KEY",
                    status_code=400,
                )

            logger.info(f"Initializing Gemini model '{model_name}' (temp: {temperature}, retries: {max_retries}).")

            return ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=google_api_key.strip(),
                temperature=temperature,
                max_retries=max_retries,
            )


        except Exception as e:
            if isinstance(e, NotesMakerError):
                raise e
            logger.exception("Failed to initialize Gemini LLM.")
            raise NotesMakerError(
                message="Failed to initialize language models due to a configuration or credential issue.",
                code="LLM_INITIALIZATION_ERROR",
                status_code=500,
            ) from e

    @classmethod
    def get_groq_llm(
        cls,
        groq_api_key: Optional[str] = None,
        model_name: str = "openai/gpt-oss-20b",
        temperature: float = 0.2,
        max_retries: int = MAX_RETRIES,
    ):
        """
        Dynamically initializes and returns the Groq LLM.
        """
        try:
            # If no user-provided key, fall back to environment variables
            if not groq_api_key:
                groq_api_key = settings.GROQ_API_KEY


            if not groq_api_key:
                logger.error("Groq API key is missing.")
                raise NotesMakerError(
                    message="Groq API key is missing. Please set it in Settings.",
                    code="MISSING_GROQ_API_KEY",
                    status_code=400,
                )

            logger.info(f"Initializing Groq model '{model_name}' (temp: {temperature}, retries: {max_retries}).")

            return ChatGroq(
                model=model_name,
                groq_api_key=groq_api_key.strip(),
                temperature=temperature,
                max_retries=max_retries,
            )

        except Exception as e:
            if isinstance(e, NotesMakerError):
                raise e
            logger.exception("Failed to initialize Groq LLM.")
            raise NotesMakerError(
                message="Failed to initialize Groq language model due to a configuration or credential issue.",
                code="GROQ_INITIALIZATION_ERROR",
                status_code=500,
            ) from e


