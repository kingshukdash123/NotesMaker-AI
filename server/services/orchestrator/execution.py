from langchain_core.prompts import ChatPromptTemplate

from server.exceptions import NotesMakerError
from server.logger import get_logger
from server.model.execution import ExecutionPlan
from server.prompts.execution_plan_prompt import EXECUTION_PLAN_PROMPT
from server.services.llm.service import LLMService

logger = get_logger(__name__)


class ExecutionPlanner:

    def __init__(self):
        self.llm = LLMService.get_llm()

    def generate(
        self,
        metadata,
        transcript,
        outline,
    ) -> ExecutionPlan:

        logger.info("Generating execution plan.")

        try:
            logger.info("Preparing execution plan prompt.")

            prompt_template = ChatPromptTemplate.from_template(
                EXECUTION_PLAN_PROMPT
            )

            prompt = prompt_template.invoke(
                {
                    "metadata": metadata,
                    "transcript": transcript,
                    "outline": outline,
                }
            )

            logger.info("Invoking LLM for execution plan generation.")

            structured_llm = self.llm.with_structured_output(
                ExecutionPlan
            )

            execution_plan = structured_llm.invoke(prompt)

            logger.info("Execution plan generated successfully.")

            return execution_plan

        except Exception as e:
            logger.exception("Execution plan generation failed.")

            raise NotesMakerError(
                message="Failed to generate execution plan.",
                code="EXECUTION_PLAN_GENERATION_ERROR",
                status_code=500,
            ) from e