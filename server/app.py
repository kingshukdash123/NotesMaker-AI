import asyncio
import uuid
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, HttpUrl

from server.logger import get_logger, current_task_id
from server.services.youtube.metadata import get_video_metadata
from server.graph.graph_builder import graph

logger = get_logger(__name__)

app = FastAPI(
    title="NotesMaker AI API",
    description="Backend REST API for NotesMaker AI including real-time pipeline log streaming.",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for tracking task states
# Structure: { task_id: { "status": str, "youtube_url": str, "metadata": dict, "result": dict, "error": str } }
tasks: Dict[str, Dict[str, Any]] = {}

class GenerateNotesRequest(BaseModel):
    youtube_url: str


async def run_pipeline_task(task_id: str, url: str):
    """
    Asynchronously executes the LangGraph notes generation pipeline,
    binding the task context variable to isolate logs.
    """
    token = current_task_id.set(task_id)
    logger.info(f"Task {task_id}: Starting notes generation pipeline for URL: {url}")
    
    try:
        # Run LangGraph pipeline asynchronously
        # ainvoke is the standard async method for LangGraph compilation graphs
        result = await graph.ainvoke({"youtube_url": url})
        
        tasks[task_id]["status"] = "COMPLETED"
        tasks[task_id]["metadata"] = result.get("metadata")
        tasks[task_id]["result"] = {
            "draft_notes": result.get("draft_notes"),
            # "final_notes": result.get("final_notes"),
            "lecture_outline": result.get("lecture_outline"),
        }
        logger.info(f"Task {task_id}: Notes generation pipeline completed successfully.")
        
    except Exception as e:
        logger.exception(f"Task {task_id}: Notes generation pipeline failed.")
        tasks[task_id]["status"] = "FAILED"
        tasks[task_id]["error"] = str(e)
    finally:
        current_task_id.reset(token)


@app.get("/")
async def root():
    return {"message": "Welcome to NotesMaker AI API. Use /docs for documentation."}


@app.get("/api/youtube/metadata")
async def fetch_metadata(url: str = Query(..., description="The YouTube URL to fetch metadata for")):
    """
    Fetches YouTube video metadata directly using yt-dlp.
    This is designed to be fast and is called before triggering notes generation.
    """
    try:
        logger.info(f"Requested metadata fetch for URL: {url}")
        metadata = get_video_metadata(url)
        return metadata
    except Exception as e:
        logger.error(f"Metadata extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notes/generate", status_code=202)
async def generate_notes(request: GenerateNotesRequest):
    """
    Starts the notes generation process in the background.
    Returns a task ID immediately, allowing the client to query status and stream logs.
    """
    task_id = str(uuid.uuid4())
    url = str(request.youtube_url)
    
    tasks[task_id] = {
        "task_id": task_id,
        "status": "PROCESSING",
        "youtube_url": url,
        "metadata": None,
        "result": None,
        "error": None
    }
    
    # Run the pipeline in the background using asyncio.create_task.
    # Unlike FastAPI BackgroundTasks, create_task runs completely concurrently
    # and plays perfectly with standard contextvars.
    asyncio.create_task(run_pipeline_task(task_id, url))
    
    logger.info(f"Dispatched background task {task_id} for URL {url}")
    return {"task_id": task_id, "status": "PROCESSING"}


@app.get("/api/notes/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Gets the current execution status and result of the notes generation task.
    """
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.get("/api/notes/logs/{task_id}/stream")
async def stream_logs(task_id: str):
    """
    Server-Sent Events (SSE) endpoint to stream execution logs in real-time.
    """
    # Verify task exists
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
        
    async def log_generator():
        log_file = Path("logs/tasks") / f"{task_id}.log"
        
        # Wait up to 5 seconds for the log file to be created
        for _ in range(50):
            if log_file.exists():
                break
            await asyncio.sleep(0.1)
            
        if not log_file.exists():
            yield "data: [SYSTEM] Log file not created yet. Waiting...\n\n"
            
        # Stream the log file
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                # 1. Read existing lines
                while True:
                    line = f.readline()
                    if not line:
                        break
                    yield f"data: {line.strip()}\n\n"
                    
                # 2. Tail new lines
                while True:
                    line = f.readline()
                    if line:
                        yield f"data: {line.strip()}\n\n"
                    else:
                        # Check if task is finished
                        task_state = tasks.get(task_id)
                        if task_state and task_state["status"] in ("COMPLETED", "FAILED"):
                            # Read any leftover logs that might have just been written
                            line = f.readline()
                            if line:
                                yield f"data: {line.strip()}\n\n"
                            break
                        await asyncio.sleep(0.2)
        except GeneratorExit:
            logger.info(f"Log stream disconnected for task {task_id}")
        except Exception as e:
            logger.error(f"Error streaming logs for task {task_id}: {str(e)}")
            yield f"data: [SYSTEM ERROR] {str(e)}\n\n"
            
    return StreamingResponse(log_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.app:app", host="0.0.0.0", port=8000, reload=True)
