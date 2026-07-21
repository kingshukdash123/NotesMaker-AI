from typing import Literal

from state.sectionState import SectionState
from utils.logger import get_logger
from utils.exceptions import NotesMakerError

logger = get_logger(__name__)


def research_router(state: SectionState,) -> Literal["research", "section_writer"]:
    """
    Route each worker either to the Research node
    or directly to the Section Writer.
    """

    logger.info(
        "Routing section %d: '%s'",
        state["section_plan"]["section_id"],
        state["section_plan"]["title"],
    )

    try:
        if state["section_plan"]["research_required"]:
            logger.info(
                "Research required for section %d.",
                state["section_plan"]["section_id"],
            )
            return "research"

        logger.info(
            "Research not required for section %d. Routing directly to Section Writer.",
            state["section_plan"]["section_id"],
        )
        return "section_writer"

    except Exception as e:
        logger.exception("Research router failed.")

        raise NotesMakerError(
            message="Failed to route section worker.",
            code="RESEARCH_ROUTER_ERROR",
            status_code=500,
        ) from e