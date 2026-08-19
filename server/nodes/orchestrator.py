from state.state import NotesState
from services.orchestrator.orchestrator import OrchestratorService
from utils.logger import get_logger
from utils.exceptions import NotesMakerError

logger = get_logger(__name__)


def orchestrator(state: NotesState) -> NotesState:

    logger.info("Analyzing curriculum and planning lecture outline.")

    try:
        service = OrchestratorService(
            google_api_key=state.get("google_api_key"),
        )

        # Format transcript as plain text to eliminate JSON formatting token overhead
        formatted_transcript = "\n".join(
            f"[{s['id']}] {s['text']}" for s in state["merged_transcript"]
        )

        outline, execution_plan = service.run(
            metadata=state["metadata"],
            transcript=formatted_transcript,
        )

        state["lecture_outline"] = outline
        state["execution_plan"] = execution_plan

        # Group sections into chapters of size 3
        sections = execution_plan.get("sections", [])
        chapters = []
        batch_size = 3
        for i in range(0, len(sections), batch_size):
            chapter_sections = sections[i : i + batch_size]
            chapter_id = (i // batch_size) + 1
            chapters.append(
                {
                    "chapter_id": chapter_id,
                    "sections": chapter_sections,
                }
            )
        
        state["chapters"] = chapters
        state["generated_sections"] = []  # Initialize empty list to accumulate sections

        logger.info(
            "Curriculum outline planned successfully. Structured %d sections into %d chapters.",
            len(sections),
            len(chapters),
        )

        return state

    except Exception as e:
        logger.exception("Curriculum planning failed.")

        raise NotesMakerError(
            message="Failed to generate lecture outline and execution plan.",
            code="ORCHESTRATOR_NODE_ERROR",
            status_code=500,
        ) from e