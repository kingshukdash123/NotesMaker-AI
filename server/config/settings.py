from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    TAVILY_API_KEY: str
    FIREBASE_PROJECT_ID: str | None = None
    PINECONE_API_KEY: str | None = None
    PINECONE_INDEX_NAME: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()