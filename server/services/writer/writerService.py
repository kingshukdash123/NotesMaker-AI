from langchain_core.prompts import ChatPromptTemplate

from server.services.llm.service import LLMService
from server.exceptions import NotesMakerError
from server.logger import get_logger
from server.model.execution import SectionPlan
from server.model.metadata import VideoMetadata
from server.model.outline import LectureOutline
from server.model.notes import GeneratedSection, GeneratedSectionModel
from server.prompts.section_writer_prompt import SECTION_WRITER_PROMPT

logger = get_logger(__name__)


class SectionWriterService:
    """
    Service responsible for generating a single lecture section.
    """

    def __init__(self):

        logger.info("Initializing SectionWriterService.")

        self.base_llm = LLMService.get_llm()
        
        self.llm = self.base_llm.with_structured_output(
            GeneratedSectionModel
        )
        self.prompt = ChatPromptTemplate.from_template(
            SECTION_WRITER_PROMPT
        )

    def run(
        self,
        # metadata: VideoMetadata,
        # transcript: str,
        lecture_outline: LectureOutline,
        section_plan: SectionPlan,
        research_results: str | None,
    ) -> GeneratedSection:

        try:

            logger.info(
                "Generating section %d: %s",
                section_plan["section_id"],
                section_plan["title"],
            )

            messages = self.prompt.invoke(
                {
                    # "metadata": metadata,
                    # "transcript": transcript,
                    "outline": lecture_outline,
                    "section": section_plan,
                    "research": research_results or "No external research available.",
                }
            )

            generated_section_model = self.llm.invoke(messages)

            generated_section = generated_section_model.model_dump()

            logger.info(
                "Section %d generated successfully.",
                section_plan["section_id"],
            )

            return generated_section

        except Exception as e:

            logger.exception(
                "Section generation failed."
            )

            raise NotesMakerError(
                message="Failed to generate lecture section.",
                code="SECTION_WRITER_SERVICE_ERROR",
                status_code=500,
            ) from e