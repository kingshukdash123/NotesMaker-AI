import httpx
import os
import re

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
    Uses SerpApi in production if SERPAPI_API_KEY is configured, otherwise falls back to local scraping.
    """

    logger.info(f"Fetching transcript for video: {video_id}")

    serpapi_key = os.getenv("SERPAPI_API_KEY")
    if serpapi_key:
        logger.info("Using SerpApi for transcript extraction.")
        try:
            url = "https://serpapi.com/search"
            params = {
                "engine": "youtube_video_transcript",
                "v": video_id,
                "api_key": serpapi_key,
            }
            
            with httpx.Client() as client:
                # Fetch default available transcript directly
                response = client.get(url, params=params, timeout=20.0)
                data = response.json() if response.status_code == 200 else {}
                transcript_data = data.get("transcript", [])
                
                # If still not found, try auto-generated (ASR) transcript
                if not transcript_data:
                    logger.info("Direct transcript not found on SerpApi. Attempting auto-generated (ASR) transcript...")
                    params["type"] = "asr"
                    response = client.get(url, params=params, timeout=20.0)
                    data = response.json() if response.status_code == 200 else {}
                    transcript_data = data.get("transcript", [])
                    
                if transcript_data:
                    segments: list[TranscriptSegment] = []
                    for item in transcript_data:
                        text = clean_text(item.get("snippet", ""))
                        if text is None:
                            continue
                        start_ms = item.get("start_ms", 0)
                        end_ms = item.get("end_ms", 0)
                        
                        segments.append(
                            {
                                "id": len(segments) + 1,
                                "start": start_ms / 1000.0,
                                "end": end_ms / 1000.0,
                                "text": text,
                            }
                        )
                    logger.info(
                        f"Fetched {len(segments)} cleaned transcript segments using SerpApi."
                    )
                    return segments
                else:
                    logger.warning("SerpApi could not find any transcript for this video.")
        except Exception as e:
            logger.exception("SerpApi transcript extraction failed. Falling back to local scraping...")

    # Local scraping phase (for development/fallback without cookies or proxies)
    try:
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