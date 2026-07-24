from langgraph.types import Send

from state.state import NotesState
from state.sectionState import SectionState
from utils.logger import get_logger
from utils.exceptions import NotesMakerError

logger = get_logger(__name__)


def fanout(state: NotesState):
    """
    Creates one worker for each section in the execution plan.

    Each worker receives an isolated SectionState.
    """

    logger.info("Starting Fan-out node.")

    try:
        execution_plan = state["execution_plan"]

        sends = []

        for section in execution_plan["sections"]:

            worker_state: SectionState = {
                # "metadata": state["metadata"],
                # "merged_transcript": state["merged_transcript"],
                "lecture_outline": state["lecture_outline"],
                "section_plan": section,
                "research_results": None,
                "generated_sections": None,
                "google_api_key": state.get("google_api_key"),
                "groq_api_key": state.get("groq_api_key"),
            }

            sends.append(
                Send(
                    "section_worker",
                    worker_state,
                )
            )

        logger.info(
            "Fan-out completed successfully. Created %d section workers.",
            len(sends),
        )

        return sends

    except Exception as e:
        logger.exception("Fan-out node failed.")

        raise NotesMakerError(
            message="Failed to create section workers.",
            code="FANOUT_NODE_ERROR",
            status_code=500,
        ) from e