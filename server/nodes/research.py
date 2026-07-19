from server.state.sectionState import SectionState
from server.services.research.researchService import ResearchService
from server.logger import get_logger
from server.exceptions import NotesMakerError

logger = get_logger(__name__)


def research(state: SectionState) -> SectionState:

    logger.info("Starting Research node.")

    try:

        service = ResearchService()

        result = service.search(
            state["section_plan"]["research_query"]
        )

        logger.info("Research node completed successfully.")

        return {
            "research_results": result,
        }

    except Exception as e:

        logger.exception("Research node failed.")

        raise NotesMakerError(
            message="Failed to perform section research.",
            code="RESEARCH_NODE_ERROR",
            status_code=500,
        ) from e