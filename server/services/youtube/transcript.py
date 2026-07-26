import httpx
import os
import re

from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

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


def _fetch_via_serpapi(video_id: str, serpapi_key: str) -> list[TranscriptSegment]:
    """Helper to fetch transcripts using SerpApi."""
    url = "https://serpapi.com/search"
    params = {
        "engine": "youtube_video_transcript",
        "v": video_id,
        "api_key": serpapi_key,
    }
    
    with httpx.Client() as client:
        # Request auto-generated (ASR) transcript via SerpApi.
        logger.info("Attempting auto-generated (ASR) transcript via SerpApi...")
        params["type"] = "asr"
        
        # Timeout set to 300.0 seconds to support fetching transcripts for extremely long videos (up to 15 hours)
        response = client.get(url, params=params, timeout=300.0)
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
            logger.warning("SerpApi could not find any auto-generated (ASR) transcript for this video.")
            raise NotesMakerError(
                message="No auto-generated transcripts found via SerpApi for this video.",
                code="TRANSCRIPT_NOT_FOUND",
                status_code=404,
            )


def _fetch_via_local_scraper(video_id: str) -> list[TranscriptSegment]:
    """Helper to fetch transcripts using YouTubeTranscriptApi (local scraping)."""
    logger.info("Attempting local scraping for transcript...")
    transcript_list = YouTubeTranscriptApi().list(video_id)
    
    # Pick the first available transcript (any language is acceptable)
    available = list(transcript_list)
    if not available:
        raise NotesMakerError(
            message="No transcripts (subtitles) are available for this video.",
            code="TRANSCRIPT_NOT_FOUND",
            status_code=404,
        )
    # Pick the first available transcript
    transcript_obj = available[0]
    logger.info(f"Selected transcript: {transcript_obj.language} ({transcript_obj.language_code})")

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
        f"Successfully fetched {len(segments)} segments using local scraping."
    )
    return segments


def get_transcript(video_id: str) -> list[TranscriptSegment]:
    """
    Fetch and clean the transcript of a YouTube video (English preferred, otherwise fallback).
    In cloud environments (like Render/production), routes directly through SerpApi.
    In local development, uses local scraping only (never calls SerpApi to save credits).
    """
    logger.info(f"Fetching transcript for video: {video_id}")

    serpapi_key = os.getenv("SERPAPI_API_KEY")
    is_cloud = os.getenv("ENV") == "production"

    # 1. Cloud routing check (production)
    if is_cloud and serpapi_key:
        logger.info("Cloud environment detected. Routing directly to SerpApi.")
        try:
            return _fetch_via_serpapi(video_id, serpapi_key)
        except Exception as e:
            if isinstance(e, NotesMakerError):
                raise e
            logger.exception("SerpApi transcript extraction failed in cloud environment.")
            raise NotesMakerError(
                message="Failed to fetch transcript. Subtitles might be disabled or unavailable for this video.",
                code="TRANSCRIPT_ERROR",
                status_code=500,
            )

    # 2. Local environment: Local scraping only (no SerpApi fallback)
    try:
        return _fetch_via_local_scraper(video_id)
    except Exception as e:
        if isinstance(e, NotesMakerError):
            raise e
            
        if isinstance(e, (TranscriptsDisabled, NoTranscriptFound)):
            logger.warning(f"YouTube reports subtitles are disabled/unavailable for video {video_id}.")
            raise NotesMakerError(
                message="No transcripts (subtitles) are available for this video.",
                code="TRANSCRIPT_NOT_FOUND",
                status_code=404,
            )
            
        logger.exception("Local scraping failed.")
        raise NotesMakerError(
            message="Failed to fetch transcript. Subtitles might be disabled or unavailable for this video.",
            code="TRANSCRIPT_ERROR",
            status_code=500,
        )