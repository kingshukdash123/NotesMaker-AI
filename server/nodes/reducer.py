from server.exceptions import NotesMakerError
from server.logger import get_logger
from server.state.state import NotesState
from server.model.notes import DraftNotes
from server.services.database.noteSaver import save_notes_to_output

logger = get_logger(__name__)


def reducer(state: NotesState) -> NotesState:
    """
    Merge all generated sections into a single DraftNotes object.
    """

    logger.info("Starting Reducer node.")

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

        # Save final notes to output folder
        output_file = save_notes_to_output(draft_notes["title"], draft_notes["content"])

        logger.info(
            "Reducer completed successfully. Total sections merged: %d. Saved notes to %s",
            len(sections),
            output_file,
        )

        return state

    except Exception as e:

        logger.exception("Reducer node failed.")

        raise NotesMakerError(
            message="Failed to merge generated sections.",
            code="REDUCER_NODE_ERROR",
            status_code=500,
        ) from e