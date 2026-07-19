from server.state.sectionState import SectionState
from server.services.writer.writerService import SectionWriterService
from server.logger import get_logger
from server.exceptions import NotesMakerError

logger = get_logger(__name__)


def section_writer(state: SectionState) -> SectionState:
    """
    Generates a single lecture section.

    Each worker processes exactly one section.
    """

    logger.info(
        "Starting Section Writer for section %d.",
        state["section_plan"]["section_id"],
    )

    try:
        service = SectionWriterService()

        generated_section = service.run(
            # metadata=state["metadata"],
            # transcript=state["merged_transcript"],
            lecture_outline=state["lecture_outline"],
            section_plan=state["section_plan"],
            research_results=state["research_results"],
        )

        # state["generated_section"] = generated_section

        logger.info(
            "Section Writer completed for section %d.",
            state["section_plan"]["section_id"],
        )

        return {
            # "generated_section": generated_section,
            "generated_sections": [generated_section],
        }

    except Exception as e:

        logger.exception("Section Writer node failed.")

        raise NotesMakerError(
            message="Failed to generate lecture section.",
            code="SECTION_WRITER_NODE_ERROR",
            status_code=500,
        ) from e