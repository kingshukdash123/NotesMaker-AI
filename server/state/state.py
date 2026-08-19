from typing import TypedDict, Optional, List, Annotated
import operator

from model.metadata import VideoMetadata
from model.transcript import TranscriptSegment
from model.outline import LectureOutline
from model.execution import ExecutionPlan, ChapterPlan
from model.notes import GeneratedSection, DraftNotes


class NotesState(TypedDict):

    # User
    youtube_url: str

    # Metadata
    metadata: VideoMetadata

    # Transcript
    transcript_segments: List[TranscriptSegment]

    # Merged Transcript
    merged_transcript: List[TranscriptSegment]

    # Sequential Loop State
    chapters: List[ChapterPlan]

    # Lecture Outline
    lecture_outline: LectureOutline

    # Execution Plan
    execution_plan: ExecutionPlan

    # Generated Sections
    generated_sections: Annotated[list[GeneratedSection], operator.add]

    # Draft
    draft_notes: DraftNotes

    # User API Keys
    google_api_key: Optional[str]
    groq_api_key: Optional[str]
    task_id: Optional[str]