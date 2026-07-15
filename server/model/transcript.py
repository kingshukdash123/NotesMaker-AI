from typing import TypedDict

# raw transcript from youtube
class TranscriptSegment(TypedDict):
    id: int
    start: float
    end: float
    text: str
