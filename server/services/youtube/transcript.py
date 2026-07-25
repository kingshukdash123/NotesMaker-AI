import requests
from http.cookiejar import MozillaCookieJar
import os
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
    Fetch and clean the transcript of a YouTube video (English preferred, otherwise fallback).
    """

    logger.info(f"Fetching transcript for video: {video_id}")

    cookies_path = "cookies.txt" if os.path.exists("cookies.txt") else None

    try:
        # Get the list of available transcripts
        if cookies_path:
            logger.info("Using cookies.txt via custom requests Session for transcript extraction.")
            
            session = requests.Session()
            cj = MozillaCookieJar(cookies_path)
            cj.load(ignore_discard=True, ignore_expires=True)
            session.cookies = cj
            
            # Pass custom session with cookies to YouTubeTranscriptApi
            transcript_list = YouTubeTranscriptApi(http_client=session).list(video_id)

        # for development phase
        else: 
            transcript_list = YouTubeTranscriptApi().list(video_id)
        
        # Try to find direct English transcript first
        try:
            transcript_obj = transcript_list.find_transcript([TRANSCRIPT_LANGUAGE])
            logger.info(f"Found transcript in preferred language: {TRANSCRIPT_LANGUAGE}")
        except Exception:
            logger.info(f"Preferred transcript language '{TRANSCRIPT_LANGUAGE}' not found. Falling back...")
            
            # Fall back to any available transcript (e.g. Hindi, Bengali, etc.)
            available = list(transcript_list)
            if not available:
                raise NotesMakerError(
                    message="No transcripts (subtitles) are available for this video.",
                    code="TRANSCRIPT_NOT_FOUND",
                    status_code=404,
                )
            # Pick the first available transcript
            transcript_obj = available[0]
            logger.info(f"Selected fallback transcript: {transcript_obj.language} ({transcript_obj.language_code})")

        # Fetch the transcript data
        transcript_data = transcript_obj.fetch()

        segments: list[TranscriptSegment] = []

        for segment in transcript_data:
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
            f"Fetched {len(segments)} cleaned transcript segments in language '{transcript_obj.language_code}'."
        )

        return segments

    except Exception as e:
        if isinstance(e, NotesMakerError):
            raise e
        logger.exception("Failed to fetch transcript.")

        raise NotesMakerError(
            message="Failed to fetch transcript. Subtitles might be disabled or unavailable for this video.",
            code="TRANSCRIPT_ERROR",
            status_code=500,
        )