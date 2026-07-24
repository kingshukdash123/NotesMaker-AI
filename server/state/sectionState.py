from typing import TypedDict, Optional

from model.execution import SectionPlan
from model.metadata import VideoMetadata
from model.notes import GeneratedSection
from model.outline import LectureOutline


class SectionState(TypedDict):
    # metadata: VideoMetadata
    # merged_transcript: str
    lecture_outline: LectureOutline
    section_plan: SectionPlan
    research_results: Optional[str]
    # generated_section: Optional[GeneratedSection]
    generated_sections: Optional[list[GeneratedSection]]
    google_api_key: Optional[str]
    groq_api_key: Optional[str]
    task_id: Optional[str]