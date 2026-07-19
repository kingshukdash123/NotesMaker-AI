from typing import TypedDict, Optional

from server.model.execution import SectionPlan
from server.model.metadata import VideoMetadata
from server.model.notes import GeneratedSection
from server.model.outline import LectureOutline


class SectionState(TypedDict):
    # metadata: VideoMetadata
    # merged_transcript: str
    lecture_outline: LectureOutline
    section_plan: SectionPlan
    research_results: Optional[str]
    # generated_section: Optional[GeneratedSection]
    generated_sections: Optional[list[GeneratedSection]]