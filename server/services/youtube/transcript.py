import re

# pyrefly: ignore [missing-import]
from youtube_transcript_api import YouTubeTranscriptApi

from config.constants import TRANSCRIPT_LANGUAGE
from utils.exceptions import NotesMakerError
from utils.logger import get_logger
from model.transcript import TranscriptSegment

logger = get_logger(__name__)


def clean_text(text: str) -> str | None:
    """
    Clean a transcript segment.
    Returns None if the segment should be skipped.
    """

    # Remove leading/trailing spaces
    text = text.strip()

    # Replace newlines with spaces
    text = text.replace("\n", " ")

    # Remove multiple spaces
    text = re.sub(r"\s+", " ", text)

    # Skip empty text
    if not text:
        return None

    # Skip captions like:
    # [Music], [Applause], [Laughter], [♪♪♪], etc.
    if re.fullmatch(r"\[[^\]]+\]", text):
        return None

    return text


def get_transcript(video_id: str) -> list[TranscriptSegment]:
    """
    Fetch and clean the English transcript of a YouTube video.
    """

    logger.info(f"Fetching transcript for video: {video_id}")

    try:
        transcript = YouTubeTranscriptApi().fetch(
            video_id,
            languages=[TRANSCRIPT_LANGUAGE],
        )

        segments: list[TranscriptSegment] = []

        for segment in transcript:
            text = clean_text(segment.text)

            if text is None:
                continue

            segments.append(
                {
                    "id": len(segments) + 1,
                    "start": segment.start,
                    "end": segment.start + segment.duration,
                    "text": text,
                }
            )

        logger.info(
            f"Fetched {len(segments)} cleaned transcript segments."
        )

        return segments

    except Exception as e:
        logger.exception("Failed to fetch transcript.}")

        raise NotesMakerError(
            message="Failed to fetch transcript.",
            code="TRANSCRIPT_ERROR",
            status_code=500,
        )