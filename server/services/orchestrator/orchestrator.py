from langchain_core.prompts import ChatPromptTemplate

from services.llm.service import LLMService
from model.orchestration import OrchestrationResultModel
from prompts.orchestrator_prompt import ORCHESTRATOR_PROMPT
from utils.exceptions import NotesMakerError
from utils.logger import get_logger
from utils.retry import call_llm_with_retry

logger = get_logger(__name__)


class OrchestratorService:

    def __init__(self, google_api_key=None):
        self.llm = LLMService.get_llm(google_api_key)
        self.prompt = ChatPromptTemplate.from_template(ORCHESTRATOR_PROMPT)

    def run(self, metadata, transcript):

        logger.info("Structuring lecture curriculum.")

        try:
            messages = self.prompt.invoke(
                {
                    "metadata": metadata,
                    "transcript": transcript,
                }
            )

            structured_llm = self.llm.with_structured_output(
                OrchestrationResultModel
            )

            orchestration_result_model = call_llm_with_retry(structured_llm, messages)
            orchestration_result = orchestration_result_model.model_dump()

            outline = orchestration_result["outline"]
            execution_plan = orchestration_result["execution_plan"]

            logger.info("Lecture curriculum structured successfully.")

            return outline, execution_plan

        except Exception as e:
            logger.exception("Failed to structure lecture curriculum.")

            raise NotesMakerError(
                message="Failed to generate lecture outline and execution plan.",
                code="ORCHESTRATION_SERVICE_ERROR",
                status_code=500,
            ) from e