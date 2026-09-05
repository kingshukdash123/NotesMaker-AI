# API Configuration
API_TITLE = "Pathshala AI API"
API_DESCRIPTION = "Backend REST API for Pathshala AI including real-time pipeline log streaming."
API_VERSION = "1.0.0"

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    "https://pathshala-ai.web.app",
    "https://notesmaker-ai-56407.web.app",
    "https://notesmaker-ai-56407.firebaseapp.com",
    "https://pathshalaai.co.in",
    "https://www.pathshalaai.co.in",
]

# Task Execution and Cache
TASK_EXPIRATION_SECONDS = 3600
MAX_RETRIES = 3
RETRY_DELAY = 2

# LLM Models
ORCHESTRATOR_MODEL = "gemini-3.1-flash-lite"
WRITER_MODEL = "gemini-3.5-flash-lite"
CHAT_MODEL = "qwen/qwen3.8-27b"
CHAT_FALLBACK_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]
EMBEDDING_MODEL = "models/gemini-embedding-2-preview"

# Vector Store Configs
PINECONE_INDEX_DIMENSION = 3072
PINECONE_BATCH_SIZE = 40
PINECONE_UPSERT_DELAY = 18.0

# Q&A / RAG Configs
RAG_TOP_K = 5
RAG_MEMORY_WINDOW = 5

# Assistant Configs
ASSISTANT_MEMORY_WINDOW = 4

# YouTube Configs
MAX_VIDEO_DURATION_SECONDS = 7200

# Concurrency Configs
CONCURRENT_CHAPTER_LIMIT = 5
