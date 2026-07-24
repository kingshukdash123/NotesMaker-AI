from langchain_core.prompts import ChatPromptTemplate

from utils.exceptions import NotesMakerError
from utils.logger import get_logger
from model.outline import LectureOutline
from prompts.outline_prompt import OUTLINE_PROMPT
from services.llm.service import LLMService

logger = get_logger(__name__)


class OutlineGenerator:

    def __init__(self, google_api_key=None, groq_api_key=None):
        self.llm = LLMService.get_llm(google_api_key, groq_api_key)

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