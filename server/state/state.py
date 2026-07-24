from typing import TypedDict, Optional, List, Annotated
import operator

from model.metadata import VideoMetadata
from model.transcript import TranscriptSegment
from model.outline import LectureOutline
from model.execution import ExecutionPlan
from model.notes import GeneratedSection, DraftNotes, FinalNotes
from model.review import ReviewResult


class NotesState(TypedDict):

    # User
    youtube_url: str

    # Metadata
    metadata: VideoMetadata

    # Transcript
    transcript_segments: List[TranscriptSegment]

    # Merged Transcript
    merged_transcript: List[TranscriptSegment]

    # Chunks
    # chunks: List[Chunk]

    # Chunk Summaries
    # chunk_summaries: List[ChunkSummary]

    # Lecture Outline
    lecture_outline: LectureOutline

    # Execution Plan
    execution_plan: ExecutionPlan

    # Generated Sections
    generated_sections: Annotated[list[GeneratedSection], operator.add]

    # Draft
    draft_notes: DraftNotes

    # Review_result
    review_result: ReviewResult

    # Final
    final_notes: FinalNotes

    # Graph Status
    success: bool
    error: Optional[str]

    # User API Keys
    google_api_key: Optional[str]
    groq_api_key: Optional[str]