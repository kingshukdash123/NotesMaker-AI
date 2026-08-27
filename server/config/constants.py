MAX_RETRIES = 3
RETRY_DELAY = 2

# LLM Models
ORCHESTRATOR_MODEL = "gemini-3.1-flash-lite"
WRITER_MODEL = "gemini-3.5-flash-lite"
CHAT_MODEL = "openai/gpt-oss-20b"
EMBEDDING_MODEL = "models/gemini-embedding-2-preview"

# Vector Store Configs
PINECONE_INDEX_DIMENSION = 3072
PINECONE_BATCH_SIZE = 40
PINECONE_UPSERT_DELAY = 18.0

# Q&A / RAG Configs
RAG_TOP_K = 5

# YouTube Configs
MAX_VIDEO_DURATION_SECONDS = 7200

# Concurrency Configs
CONCURRENT_CHAPTER_LIMIT = 5


