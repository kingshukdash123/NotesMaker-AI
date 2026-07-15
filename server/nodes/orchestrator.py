from server.state.state import NotesState
from server.services.orchestrator.orchestrator import OrchestratorService
from server.logger import get_logger
from server.exceptions import NotesMakerError

logger = get_logger(__name__)


def orchestrator(state: NotesState) -> NotesState:

    logger.info("Starting Orchestrator node.")

    try:
        service = OrchestratorService()

        outline, execution_plan = service.run(
            metadata=state["metadata"],
            transcript=state["merged_transcript"],
        )

        state["lecture_outline"] = outline
        state["execution_plan"] = execution_plan

        logger.info("Orchestrator node completed successfully.")

        return state

    except Exception as e:
        logger.exception("Orchestrator node failed.")

        raise NotesMakerError(
            message="Failed to generate lecture outline and execution plan.",
            code="ORCHESTRATOR_NODE_ERROR",
            status_code=500,
        ) from e