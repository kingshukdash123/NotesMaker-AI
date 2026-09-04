import os

os.environ["PATHSHALA_MODE"] = "API"

import asyncio
import uuid
import json
from pathlib import Path
from typing import Dict, Any, Optional, List

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, HttpUrl

import hashlib
from utils.logger import get_logger, current_task_id
from services.firebase.firestore import get_user_api_keys, get_cached_search, save_cached_search
from services.rag.service import RAGService
from services.assistant.service import AssistantService
from services.youtube.metadata import get_video_metadata
from services.youtube.search import search_youtube_videos
from services.youtube.playlist import get_youtube_playlist_items, get_all_youtube_playlist_items
from services.youtube.validator import extract_video_id
from graph.graph_builder import graph
import time
from config.settings import settings
from config.constants import (
    API_TITLE,
    API_DESCRIPTION,
    API_VERSION,
    ALLOWED_ORIGINS,
    TASK_EXPIRATION_SECONDS,
)

logger = get_logger(__name__)

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set([settings.CLIENT_ORIGIN] + ALLOWED_ORIGINS)),
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
@app.get("/health")
@app.get("/api")
@app.get("/api/health")
async def root():
    return {"status": "ok", "message": "Welcome to Pathshala AI API. Use /docs for documentation."}


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


@app.get("/api/youtube/search")
async def search_youtube(
    q: str = Query(..., description="The search query"),
    category: str = Query("all", description="Category filter"),
    pageToken: Optional[str] = Query(None, description="YouTube API page token for pagination"),
    type: Optional[str] = Query("all", description="Filter by type: all, video, playlist, or live")
):
    """
    Searches YouTube for educational content (videos, playlists, live streams) using official API.
    Utilizes Firestore caching to protect YouTube API quota.
    """
    if not q.strip():
        return {"items": [], "nextPageToken": None}

    # 1. Compute query hash including type filter
    normalized_q = q.lower().strip()
    content_type = (type or "all").lower().strip()
    hash_input = f"{normalized_q}|{category.lower()}|{content_type}"
    if pageToken:
        hash_input += f"|{pageToken}"
    query_hash = hashlib.md5(hash_input.encode("utf-8")).hexdigest()

    # 2. Check cache
    cached_result = await get_cached_search(query_hash)
    if cached_result:
        return cached_result

    # 3. Cache miss: Call YouTube API
    try:
        result = await search_youtube_videos(q, category, pageToken, content_type)
        
        # 4. Save to cache
        await save_cached_search(
            query_hash=query_hash,
            query=q,
            category=category,
            results=result["items"],
            next_page_token=result["nextPageToken"]
        )
        
        result["cached"] = False
        return result
    except Exception as e:
        logger.exception("Error in search_youtube endpoint")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/youtube/playlist")
async def fetch_playlist(
    playlistId: str = Query(..., description="YouTube Playlist ID"),
    pageToken: Optional[str] = Query(None, description="YouTube playlist pagination page token"),
    fetchAll: Optional[bool] = Query(False, description="Fetch all pages of playlist in sequence")
):
    """
    Fetches items in a YouTube playlist with caching and pagination to conserve quota.
    When fetchAll is True, fetches all pages across the playlist in strict sequence.
    """
    clean_id = playlistId.strip() if isinstance(playlistId, str) else str(playlistId)
    if not clean_id or clean_id == "...":
        raise HTTPException(status_code=400, detail="playlistId is required")

    is_fetch_all = bool(fetchAll)

    clean_token = pageToken.strip() if isinstance(pageToken, str) and pageToken.strip() else None
    if is_fetch_all:
        cache_key = f"playlist_all_{clean_id}"
    elif clean_token:
        cache_key = f"playlist_{clean_id}_{clean_token}"
    else:
        cache_key = f"playlist_{clean_id}"

    try:
        cached = await get_cached_search(cache_key)
        if cached:
            cached_payload = cached.get("items")
            if isinstance(cached_payload, dict) and "videos" in cached_payload:
                return cached_payload
            elif isinstance(cached_payload, list) and len(cached_payload) > 0:
                return {
                    "playlistId": clean_id,
                    "title": "Course Playlist",
                    "channel": "YouTube Creator",
                    "videos": cached_payload,
                    "itemCount": len(cached_payload),
                    "totalResults": len(cached_payload),
                    "nextPageToken": cached.get("nextPageToken")
                }
    except Exception as cache_err:
        logger.warning(f"Error checking playlist cache for {clean_id}: {cache_err}")

    try:
        if is_fetch_all:
            playlist_data = await get_all_youtube_playlist_items(clean_id)
        else:
            playlist_data = await get_youtube_playlist_items(clean_id, page_token=clean_token)

        try:
            await save_cached_search(
                query_hash=cache_key,
                query=clean_id,
                category="playlist",
                results=playlist_data,
                next_page_token=playlist_data.get("nextPageToken")
            )
        except Exception as cache_save_err:
            logger.warning(f"Error saving playlist cache for {clean_id}: {cache_save_err}")
        return playlist_data
    except Exception as e:
        logger.exception(f"Error in fetch_playlist endpoint for playlist {clean_id}")
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

    # 0. Live Stream Guard: Block notes generation if video is currently an active live stream
    try:
        video_id = extract_video_id(url)
        meta = await asyncio.to_thread(get_video_metadata, video_id)
        if meta and meta.get("is_live"):
            logger.warning(f"Blocked note generation for ongoing live stream: {video_id}")
            raise HTTPException(
                status_code=400,
                detail="Cannot generate notes for an ongoing live stream. Please wait until the livestream has ended and been archived by YouTube.",
            )
    except HTTPException:
        raise
    except Exception as check_err:
        logger.warning(f"Metadata live check skipped due to error: {check_err}")
    
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

    
    
    # Prune tasks older than expiration duration to keep memory usage low
    now = time.time()
    for expired_id in [tid for tid, t in list(tasks.items()) if now - t.get("created_at", now) > TASK_EXPIRATION_SECONDS]:
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


class AssistantChatRequest(BaseModel):
    messages: List[Dict[str, Any]]
    summary: Optional[str] = None
    user_name: Optional[str] = None


@app.post("/api/assistant/chat")
async def assistant_chat(
    request: AssistantChatRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    Endpoint for general personal assistant chat.
    Streams back JSON lines with chunk updates and short term memory summary updates.
    """
    logger.info(f"Personal Assistant chat request received for user: {x_user_id}")

    # Parse Firebase Authorization ID Token if present
    id_token = None
    if authorization and authorization.startswith("Bearer "):
        id_token = authorization.split("Bearer ")[1]

    # Fetch user API keys from Firestore if authenticated
    groq_api_key = None
    if x_user_id:
        try:
            keys = await get_user_api_keys(x_user_id, id_token)
            groq_api_key = keys.get("groq_api_key")
        except Exception as e:
            logger.error(f"Error retrieving user API keys from Firestore: {str(e)}")

    async def stream_generator():
        try:
            assistant_service = AssistantService(groq_api_key=groq_api_key)
            async for chunk in assistant_service.chat_stream(
                messages=request.messages,
                summary=request.summary,
                user_name=request.user_name
            ):
                yield chunk + "\n"
        except Exception as e:
            logger.exception("Assistant streaming process failed.")
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
