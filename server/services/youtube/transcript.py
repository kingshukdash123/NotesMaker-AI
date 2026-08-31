import httpx
import os
import re

from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

from utils.exceptions import PathshalaError
from utils.logger import get_logger
from model.transcript import TranscriptSegment
from services.firebase.firestore import get_cached_transcript, save_cached_transcript
from config.constants import MAX_VIDEO_DURATION_SECONDS
from config.settings import settings


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


def _fetch_via_transcriptapi(video_id: str, api_key: str) -> list[TranscriptSegment]:
    """Helper to fetch transcripts using TranscriptAPI.com."""
    logger.info("Attempting retrieval of subtitles from metadata service...")
    url = "https://transcriptapi.com/api/v2/youtube/transcript"
    headers = {"Authorization": f"Bearer {api_key}"}
    params = {
        "video_url": video_id,
        "format": "json",
        "include_timestamp": "true",
        "send_metadata": "false",
    }
    
    with httpx.Client() as client:
        # Timeout set to 300.0 seconds to support fetching transcripts for extremely long videos
        response = client.get(url, headers=headers, params=params, timeout=300.0)
        
        if response.status_code == 200:
            data = response.json()
            raw_transcript = data.get("transcript", [])
            
            segments: list[TranscriptSegment] = []
            for item in raw_transcript:
                text = clean_text(item.get("text", ""))
                if text is None:
                    continue
                start = item.get("start", 0.0)
                duration = item.get("duration", 0.0)
                
                segments.append(
                    {
                        "id": len(segments) + 1,
                        "start": start,
                        "end": start + duration,
                        "text": text,
                    }
                )
            logger.info(
                f"Fetched {len(segments)} cleaned transcript segments."
            )
            return segments
        else:
            logger.warning("Metadata service failed to fetch transcript.")
            raise PathshalaError(
                message="No transcript found.",
                code="TRANSCRIPT_NOT_FOUND",
                status_code=response.status_code,
            )


def _fetch_via_local_scraper(video_id: str) -> list[TranscriptSegment]:
    """Helper to fetch transcripts using YouTubeTranscriptApi (local scraping)."""
    logger.info("Attempting local retrieval for transcript...")
    transcript_list = YouTubeTranscriptApi().list(video_id)
    
    # Pick the first available transcript (any language is acceptable)
    available = list(transcript_list)
    if not available:
        raise PathshalaError(
            message="No transcripts (subtitles) are available for this video.",
            code="TRANSCRIPT_NOT_FOUND",
            status_code=404,
        )
    # Pick the first available transcript
    transcript_obj = available[0]
    logger.info(f"Selected transcript language: {transcript_obj.language}")

    # Fetch the transcript data
    transcript_data = transcript_obj.fetch()

    segments: list[TranscriptSegment] = []
    for segment in transcript_data:
        text = clean_text(segment.get("text", segment.get("snippet", "")) if isinstance(segment, dict) else getattr(segment, 'text', ''))
        if text is None:
            continue

        start = segment.get("start", 0.0) if isinstance(segment, dict) else getattr(segment, 'start', 0.0)
        duration = segment.get("duration", 0.0) if isinstance(segment, dict) else getattr(segment, 'duration', 0.0)

        segments.append(
            {
                "id": len(segments) + 1,
                "start": start,
                "end": start + duration,
                "text": text,
            }
        )

    logger.info(
        f"Successfully fetched {len(segments)} segments locally."
    )
    return segments


def get_transcript(video_id: str) -> list[TranscriptSegment]:
    """
    Fetch and clean the transcript of a YouTube video.
    First checks Firestore for a cached transcript.
    If not found, fetches it from the transcript services (TranscriptAPI or local scraper)
    and saves the transcript to Firestore.
    """
    logger.info("Fetching subtitles for video resource.")

    # 0. Check Firestore cache first
    cached_transcript = get_cached_transcript(video_id)
    if cached_transcript is not None:
        logger.info("Found cached transcript. Using cache.")
        if cached_transcript:
            last_segment = cached_transcript[-1]
            video_duration_sec = last_segment.get("end", 0.0)
            if video_duration_sec > MAX_VIDEO_DURATION_SECONDS:
                logger.error("Cached video duration of %s seconds exceeds limit.", video_duration_sec)
                raise PathshalaError(
                    message="Video is too long. In this prototype, only videos up to 2 hours are supported.",
                    code="VIDEO_TOO_LONG",
                    status_code=400,
                )

        return cached_transcript

    # 1. Fetch transcript since not cached
    api_key = settings.TRANSCRIPT_API_KEY
    is_cloud = settings.ENV == "production"
    transcript = None


    if is_cloud and api_key:
        logger.info("Routing directly to metadata service.")
        try:
            transcript = _fetch_via_transcriptapi(video_id, api_key)
        except Exception as e:
            if isinstance(e, PathshalaError):
                raise e
            logger.exception("Metadata service extraction failed.")
            raise PathshalaError(
                message="Failed to fetch transcript from metadata service.",
                code="TRANSCRIPT_ERROR",
                status_code=500,
            )
    else:
        # 2. Local environment: Local scraping only
        try:
            transcript = _fetch_via_local_scraper(video_id)
        except Exception as e:
            if isinstance(e, PathshalaError):
                raise e
                
            if isinstance(e, (TranscriptsDisabled, NoTranscriptFound)):
                logger.warning("Subtitles are disabled or unavailable for this video.")
                raise PathshalaError(
                    message="No transcripts (subtitles) are available for this video.",
                    code="TRANSCRIPT_NOT_FOUND",
                    status_code=404,
                )
                
            logger.exception("Local extraction failed.")
            raise PathshalaError(
                message="Failed to fetch transcript. Subtitles might be disabled or unavailable.",
                code="TRANSCRIPT_ERROR",
                status_code=500,
            )

    # 3. If successfully fetched, save to Firestore cache
    if transcript:
        try:
            save_cached_transcript(video_id, transcript)
        except Exception as err:
            logger.warning("Failed to save transcript to cache.")

    # 4. Enforce 2-hour video duration limit (7,200 seconds)
    if transcript:
        last_segment = transcript[-1]
        video_duration_sec = last_segment.get("end", 0.0)
        if video_duration_sec > MAX_VIDEO_DURATION_SECONDS:
            logger.error("Video duration of %s seconds exceeds limit.", video_duration_sec)
            raise PathshalaError(
                message="Video is too long. In this prototype, only videos up to 2 hours are supported.",
                code="VIDEO_TOO_LONG",
                status_code=400,
            )


    return transcript