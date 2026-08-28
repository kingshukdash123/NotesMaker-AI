import os

os.environ["NOTESMAKER_MODE"] = "API"

import asyncio
import uuid
import json
from pathlib import Path
from typing import Dict, Any, Optional, List

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, HttpUrl

from utils.logger import get_logger, current_task_id
from services.firebase.firestore import get_user_api_keys
from services.rag.service import RAGService
from services.youtube.metadata import get_video_metadata
from services.youtube.validator import extract_video_id
from graph.graph_builder import graph
import time
from config.settings import settings


logger = get_logger(__name__)

app = FastAPI(
    title="NotesMaker AI API",
    description="Backend REST API for NotesMaker AI including real-time pipeline log streaming.",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CLIENT_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for tracking task states
# Structure: { task_id: { "status": str, "youtube_url": str, "metadata": dict, "result": dict, "error": str } }
tasks: Dict[str, Dict[str, Any]] = {}

class GenerateNotesRequest(BaseModel):
    youtube_url: str


async def run_pipeline_task(
    task_id: str,
    url: str,
    google_api_key: Optional[str] = None
):
    """
    Asynchronously executes the LangGraph notes generation pipeline,
    binding the task context variable to isolate logs.
    """
    token = current_task_id.set(task_id)
    logger.info(f"Task {task_id}: Starting notes generation pipeline for URL: {url}")
    
    try:
        # Run LangGraph pipeline asynchronously
        # ainvoke is the standard async method for LangGraph compilation graphs
        result = await graph.ainvoke({
            "youtube_url": url,
            "google_api_key": google_api_key,
            "task_id": task_id,
        })
        
        logger.info(f"Task {task_id}: Notes generation pipeline completed successfully.")
        tasks[task_id]["metadata"] = result.get("metadata")
        tasks[task_id]["result"] = {
            "draft_notes": result.get("draft_notes"),
            # "final_notes": result.get("final_notes"),
            "lecture_outline": result.get("lecture_outline"),
        }
        tasks[task_id]["status"] = "COMPLETED"
        
    except Exception as e:
        logger.exception(f"Task {task_id}: Notes generation pipeline failed.")
        tasks[task_id]["error"] = str(e)
        tasks[task_id]["status"] = "FAILED"
    finally:
        current_task_id.reset(token)


@app.get("/")
@app.get("/api")
@app.get("/api/health")
async def root():
    return {"status": "ok", "message": "Welcome to NotesMaker AI API. Use /docs for documentation."}


@app.get("/api/youtube/metadata")
async def fetch_metadata(url: str = Query(..., description="The YouTube URL to fetch metadata for")):
    """
    Fetches YouTube video metadata directly using YouTube's public oEmbed API.
    This is designed to be fast and is called before triggering notes generation.
    """
    try:
        logger.info(f"Requested metadata fetch for URL: {url}")
        video_id = extract_video_id(url)
        metadata = get_video_metadata(video_id)
        return metadata
    except Exception as e:
        logger.error(f"Metadata extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notes/generate", status_code=202)
async def generate_notes(
    request: GenerateNotesRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    Starts the notes generation process in the background.
    Returns a task ID immediately, allowing the client to query status and stream logs.
    """
    task_id = str(uuid.uuid4())
    url = str(request.youtube_url)
    
    # Parse Firebase Authorization ID Token if present
    id_token = None
    if authorization and authorization.startswith("Bearer "):
        id_token = authorization.split("Bearer ")[1]
        
    # Fetch user API keys from Firestore
    google_api_key = None
    if x_user_id:
        try:
            keys = await get_user_api_keys(x_user_id, id_token)
            google_api_key = keys.get("google_api_key")
        except Exception as e:
            logger.error(f"Error retrieving user API keys from Firestore: {str(e)}")

    
    
    # Prune tasks older than 1 hour to keep memory usage low
    now = time.time()
    for expired_id in [tid for tid, t in list(tasks.items()) if now - t.get("created_at", now) > 3600]:
        tasks.pop(expired_id, None)
        
    tasks[task_id] = {
        "task_id": task_id,
        "status": "PROCESSING",
        "youtube_url": url,
        "metadata": None,
        "result": None,
        "error": None,
        "created_at": now
    }
    
    # Run the pipeline in the background using asyncio.create_task.
    # Unlike FastAPI BackgroundTasks, create_task runs completely concurrently
    # and plays perfectly with standard contextvars.
    asyncio.create_task(run_pipeline_task(task_id, url, google_api_key))
    
    logger.info(f"Dispatched background task {task_id} for URL {url}")
    return {"task_id": task_id, "status": "PROCESSING"}


class QARequest(BaseModel):
    video_id: str
    question: str
    history: Optional[List[Dict[str, Any]]] = None


@app.post("/api/notes/qa")
async def ask_question(
    request: QARequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    Endpoint to ask questions about a video using RAG search over transcript.
    Streams back JSON lines with chunk updates.
    """
    logger.info(f"Q&A request received for video: {request.video_id}")

    # Parse Firebase Authorization ID Token if present
    id_token = None
    if authorization and authorization.startswith("Bearer "):
        id_token = authorization.split("Bearer ")[1]

    # Fetch user API keys from Firestore if authenticated
    google_api_key = None
    groq_api_key = None
    if x_user_id:
        try:
            keys = await get_user_api_keys(x_user_id, id_token)
            google_api_key = keys.get("google_api_key")
            groq_api_key = keys.get("groq_api_key")
        except Exception as e:
            logger.error(f"Error retrieving user API keys from Firestore: {str(e)}")

    async def stream_generator():
        try:
            rag_service = RAGService(google_api_key=google_api_key, groq_api_key=groq_api_key)
            async for chunk in rag_service.answer_question_stream(
                video_id=request.video_id,
                question=request.question,
                history=request.history
            ):
                yield chunk + "\n"
        except Exception as e:
            logger.exception("Q&A streaming process failed.")
            yield json.dumps({"type": "error", "data": str(e)}) + "\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


@app.get("/api/notes/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Gets the current execution status and result of the notes generation task.
    """
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
