from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENV: str = "development"
    TAVILY_API_KEY: str | None = None
    FIREBASE_PROJECT_ID: str | None = None
    PINECONE_API_KEY: str | None = None
    PINECONE_INDEX_NAME: str = "notesmaker-ai"
    GROQ_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    TRANSCRIPT_API_KEY: str | None = None
    CLIENT_ORIGIN: str = "http://localhost:3000"


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()