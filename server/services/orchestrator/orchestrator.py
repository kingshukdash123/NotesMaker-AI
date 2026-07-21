from utils.exceptions import NotesMakerError
from utils.logger import get_logger
from services.orchestrator.execution import ExecutionPlanner
from services.orchestrator.outline import OutlineGenerator

logger = get_logger(__name__)


class OrchestratorService:

    def __init__(self):
        self.outline_generator = OutlineGenerator()
        self.execution_planner = ExecutionPlanner()

    def run(self, metadata, transcript):

        logger.info("Starting orchestration service.")

        try:
            outline = self.outline_generator.generate(
                metadata,
                transcript,
            )

            execution_plan = self.execution_planner.generate(
                metadata,
                transcript,
                outline,
            )

            logger.info("Orchestration service completed successfully.")

            return outline, execution_plan

        except Exception as e:
            logger.exception("Orchestration service failed.")

            raise NotesMakerError(
                message="Failed to generate lecture outline and execution plan.",
                code="ORCHESTRATION_SERVICE_ERROR",
                status_code=500,
            ) from e