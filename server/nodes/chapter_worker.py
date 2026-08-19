from state.state import NotesState
from state.sectionState import ChapterState
from nodes.chapterWriter import chapter_writer
from utils.logger import get_logger

logger = get_logger(__name__)


def chapter_worker_node(state: NotesState) -> dict:
    """
    Executes a single step in the sequential chapter generation loop.
    """
    current_idx = state["current_chapter_index"]
    chapters = state["chapters"]

    if current_idx >= len(chapters):
        logger.warning(
            "Chapter index %d out of bounds (total chapters: %d).",
            current_idx,
            len(chapters),
        )
        return {}

    chapter_plan = chapters[current_idx]

    # Construct the isolated worker state
    worker_state: ChapterState = {
        "lecture_outline": state["lecture_outline"],
        "chapter_plan": chapter_plan,
        "transcript_segments": state["merged_transcript"],
        "previous_notes": state.get("previous_notes_content", ""),
        "generated_sections": None,
        "google_api_key": state.get("google_api_key"),
        "groq_api_key": state.get("groq_api_key"),
        "task_id": state.get("task_id"),
    }

    # Execute the chapter_writer node
    result = chapter_writer(worker_state)

    generated_sections = result.get("generated_sections", [])

    # Format notes for context flow to the next chapter
    new_notes_text = "\n\n".join(
        f"### {sec['title']}\n{sec['content']}" for sec in generated_sections
    )

    return {
        "generated_sections": generated_sections,
        "current_chapter_index": current_idx + 1,
        "previous_notes_content": new_notes_text,
    }


def chapter_router(state: NotesState) -> str:
    """
    Decides whether to continue loop or route to reducer.
    """
    current_idx = state["current_chapter_index"]
    total_chapters = len(state.get("chapters", []))

    if current_idx < total_chapters:
        return "chapter_worker"
    else:
        return "reducer"
