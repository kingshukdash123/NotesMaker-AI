from state.sectionState import ChapterState
from services.writer.writerService import ChapterWriterService
from utils.logger import get_logger
from utils.exceptions import NotesMakerError

logger = get_logger(__name__)


def chapter_writer(state: ChapterState) -> dict:
    """
    Generates notes for a single chapter (a batch of sections).
    """

    chapter_id = state["chapter_plan"]["chapter_id"]
    logger.info(
        "Starting Chapter Writer for chapter %d.",
        chapter_id,
    )

    try:
        # 1. Identify the range of transcript segments for this chapter
        sections = state["chapter_plan"]["sections"]
        if not sections:
            logger.warning("No sections in chapter %d plan.", chapter_id)
            return {"generated_sections": []}

        start_id = min(s["start_segment_id"] for s in sections)
        end_id = max(s["end_segment_id"] for s in sections)

        logger.info(
            "Chapter %d transcript range: segment %d to %d.",
            chapter_id,
            start_id,
            end_id,
        )

        # 2. Slice and format the transcript segments
        sliced_segments = [
            s for s in state["transcript_segments"]
            if start_id <= s["id"] <= end_id
        ]
        
        sliced_text = "\n".join(
            f"[{s['id']}] {s['text']}" for s in sliced_segments
        )

        # 3. Call the ChapterWriterService
        service = ChapterWriterService(
            google_api_key=state.get("google_api_key"),
            groq_api_key=state.get("groq_api_key"),
        )

        generated_sections = service.run(
            lecture_outline=state["lecture_outline"],
            chapter_plan=state["chapter_plan"],
            transcript=sliced_text,
            previous_notes=state.get("previous_notes", ""),
        )

        logger.info(
            "Chapter Writer completed for chapter %d.",
            chapter_id,
        )

        return {
            "generated_sections": generated_sections,
        }

    except Exception as e:

        logger.exception("Chapter Writer node failed.")

        raise NotesMakerError(
            message="Failed to generate chapter notes.",
            code="CHAPTER_WRITER_NODE_ERROR",
            status_code=500,
        ) from e