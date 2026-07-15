from langchain_core.prompts import ChatPromptTemplate

from server.exceptions import NotesMakerError
from server.logger import get_logger
from server.model.outline import LectureOutline
from server.prompts.outline_prompt import OUTLINE_PROMPT
from server.services.llm.service import LLMService

logger = get_logger(__name__)


class OutlineGenerator:

    def __init__(self):
        self.llm = LLMService.get_llm()

    def generate(self, metadata, transcript) -> LectureOutline:

        logger.info("Generating lecture outline.")

        try:
            logger.info("Preparing outline prompt.")

            promt_template = ChatPromptTemplate.from_template(OUTLINE_PROMPT)

            prompt = promt_template.invoke(
                {
                    "metadata": metadata,
                    "transcript": transcript,
                }
            )

            logger.info("Invoking LLM for lecture outline generation.")

            structured_llm = self.llm.with_structured_output(LectureOutline)

            outline = structured_llm.invoke(prompt)

            logger.info("Lecture outline generated successfully.")

            return outline

        except Exception as e:
            logger.exception("Lecture outline generation failed.")

            raise NotesMakerError(
                message="Failed to generate lecture outline.",
                code="OUTLINE_GENERATION_ERROR",
                status_code=500,
            ) from e