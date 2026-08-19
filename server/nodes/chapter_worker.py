from state.sectionState import ChapterState
from nodes.chapterWriter import chapter_writer
from utils.logger import get_logger

logger = get_logger(__name__)


def chapter_worker_node(state: ChapterState) -> dict:
    """
    Executes chapter generation for a single chapter plan in parallel.
    """
    chapter_plan = state["chapter_plan"]
    chapter_id = chapter_plan["chapter_id"]
    logger.info("Executing chapter worker node for chapter %d.", chapter_id)

    # Execute the chapter_writer node
    result = chapter_writer(state)

    generated_sections = result.get("generated_sections", [])

    return {
        "generated_sections": generated_sections,
    }
