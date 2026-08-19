from typing import TypedDict, Optional, Any

from model.execution import ChapterPlan
from model.notes import GeneratedSection
from model.outline import LectureOutline


class ChapterState(TypedDict):
    lecture_outline: LectureOutline
    chapter_plan: ChapterPlan
    transcript_segments: list[Any]
    previous_notes: Optional[str]
    generated_sections: Optional[list[GeneratedSection]]
    google_api_key: Optional[str]
    groq_api_key: Optional[str]
    task_id: Optional[str]


# Legacy alias to prevent import errors in unused node files
SectionState = ChapterState