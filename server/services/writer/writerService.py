from langchain_core.prompts import ChatPromptTemplate

from services.llm.service import LLMService
from utils.exceptions import PathshalaError
from utils.logger import get_logger

from model.execution import ChapterPlan
from model.outline import LectureOutline
from model.notes import GeneratedSection, ChapterNotesModel
from prompts.chapter_writer_prompt import CHAPTER_WRITER_PROMPT
from config.constants import WRITER_MODEL

logger = get_logger(__name__)


class ChapterWriterService:
    """
    Service responsible for generating notes for a chapter (a batch of sections).
    """

    def __init__(self, google_api_key=None):

        logger.info("Initializing study notes generation service.")

        self.base_llm = LLMService.get_gemini_llm(google_api_key, model_name=WRITER_MODEL)


        
        self.llm = self.base_llm.with_structured_output(
            ChapterNotesModel
        )
        self.prompt = ChatPromptTemplate.from_template(
            CHAPTER_WRITER_PROMPT
        )

    def run(
        self,
        lecture_outline: LectureOutline,
        chapter_plan: ChapterPlan,
        transcript: str,
        audience: str = "All Students",
        note_style: str = "Standard Lecture Notes",
    ) -> list[GeneratedSection]:

        try:
            logger.info(
                "Generating chapter %d: writing sections %s",
                chapter_plan["chapter_id"],
                [s["section_id"] for s in chapter_plan["sections"]],
            )

            messages = self.prompt.invoke(
                {
                    "outline": lecture_outline,
                    "sections": chapter_plan["sections"],
                    "transcript": transcript,
                    "audience": audience,
                    "note_style": note_style,
                }
            )

            chapter_notes_model = self.llm.invoke(messages)

            generated_sections = [
                sec.model_dump() for sec in chapter_notes_model.sections
            ]

            logger.info(
                "Chapter %d generated successfully with %d sections.",
                chapter_plan["chapter_id"],
                len(generated_sections),
            )

            return generated_sections

        except Exception as e:

            logger.exception(
                "Chapter generation failed."
            )

            raise PathshalaError(
                message="Failed to generate chapter notes.",
                code="CHAPTER_WRITER_SERVICE_ERROR",
                status_code=500,
            ) from e