from typing import TypedDict, Optional

from server.model.execution import SectionPlan
from server.model.metadata import VideoMetadata


class SectionState(TypedDict):
    metadata: VideoMetadata

    merged_transcript: str

    section_plan: SectionPlan

    research: Optional[str]

    generated_section: Optional[str]