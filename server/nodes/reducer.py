from utils.exceptions import NotesMakerError
from utils.logger import get_logger, current_task_id
from state.state import NotesState
from model.notes import DraftNotes
from services.database.noteSaver import save_notes_to_output

logger = get_logger(__name__)


def reducer(state: NotesState) -> NotesState:
    """
    Merge all generated sections into a single DraftNotes object.
    """

    logger.info("Synthesizing and assembling final study guide.")

    try:

        sections = sorted(
            state["generated_sections"],
            key=lambda section: section["section_id"],
        )

        draft_notes: DraftNotes = {
            "title": state["metadata"]["title"],
            "content": "\n\n".join(
                section["content"] for section in sections
            ),
            "sections": sections,
        }

        state["draft_notes"] = draft_notes
        
        # Only save to local output folder in development/testing mode (when task_id is None)
        if current_task_id.get(None) is None:
            output_file = save_notes_to_output(draft_notes["title"], draft_notes["content"])
            logger.info(
                "Synthesis completed. Total sections merged: %d. Saved notes to %s",
                len(sections),
                output_file,
            )
        else:
            logger.info(
                "Synthesis completed successfully. Total sections merged: %d.",
                len(sections),
            )

        return state

    except Exception as e:

        logger.exception("Synthesis failed.")

        raise NotesMakerError(
            message="Failed to merge generated sections.",
            code="REDUCER_NODE_ERROR",
            status_code=500,
        ) from e