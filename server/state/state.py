from typing import TypedDict, Optional, List, Annotated
import operator

from server.model.metadata import VideoMetadata
from server.model.transcript import TranscriptSegment
from server.model.outline import LectureOutline
from server.model.execution import ExecutionPlan
from server.model.notes import GeneratedSection, DraftNotes, FinalNotes
from server.model.review import ReviewResult


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