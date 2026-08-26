import os
import threading
from state.sectionState import ChapterState
from nodes.chapterWriter import chapter_writer
from utils.logger import get_logger

logger = get_logger(__name__)

# Throttle chapter generation concurrency to prevent API rate limit issues (TPM/RPM)
# Default limit is 10 concurrent chapters
CONCURRENT_CHAPTER_LIMIT = int(os.getenv("CONCURRENT_CHAPTER_LIMIT", "5"))
concurrency_semaphore = threading.Semaphore(CONCURRENT_CHAPTER_LIMIT)


def chapter_worker_node(state: ChapterState) -> dict:
    """
    Executes chapter generation for a single chapter plan in parallel.
    Uses a semaphore to limit concurrent LLM requests and avoid rate limits.
    """
    chapter_plan = state["chapter_plan"]
    chapter_id = chapter_plan["chapter_id"]
    
    logger.info("Chapter worker scheduled for chapter %d (waiting for concurrency slot).", chapter_id)
    
    with concurrency_semaphore:
        logger.info("Acquired slot. Commencing chapter %d generation.", chapter_id)
        # Execute the chapter_writer node
        result = chapter_writer(state)

    generated_sections = result.get("generated_sections", [])

    return {
        "generated_sections": generated_sections,
    }
