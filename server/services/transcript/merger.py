import re
from utils.logger import get_logger
from model.transcript import TranscriptSegment

logger = get_logger(__name__)

# Approximate number of words in one merged paragraph
MAX_WORDS = 150

# Regex to catch common verbal fillers without affecting technical terminology
FILLER_WORDS_REGEX = re.compile(
    r"\b(you know|basically|actually|sort of|kind of|stuff like that|i mean|as in|you know what i mean)\b",
    re.IGNORECASE,
)


def remove_fillers(text: str) -> str:
    """Removes common conversational filler phrases and cleans up spacing."""
    cleaned = FILLER_WORDS_REGEX.sub("", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def merge_transcript(
    transcript: list[TranscriptSegment],
) -> list[TranscriptSegment]:
    """
    Merge small transcript segments into larger paragraphs, filtering out filler words.
    """

    logger.info("Merging transcript segments and filtering filler words...")

    merged_segments: list[TranscriptSegment] = []

    current_text = []
    current_start = None
    current_end = None
    word_count = 0

    for segment in transcript:
        # Clean the text of filler words first
        cleaned_text = remove_fillers(segment["text"])
        if not cleaned_text:
            continue

        words = cleaned_text.split()

        # Start a new paragraph
        if current_start is None:
            current_start = segment["start"]

        current_text.extend(words)
        current_end = segment["end"]
        word_count += len(words)

        # Create a paragraph once it reaches the limit
        if word_count >= MAX_WORDS:

            merged_segments.append(
                {
                    "id": len(merged_segments) + 1,
                    "start": current_start,
                    "end": current_end,
                    "text": " ".join(current_text),
                }
            )

            current_text = []
            current_start = None
            current_end = None
            word_count = 0

    # Remaining text
    if current_text:
        merged_segments.append(
            {
                "id": len(merged_segments) + 1,
                "start": current_start,
                "end": current_end,
                "text": " ".join(current_text),
            }
        )

    logger.info(f"Merged into {len(merged_segments)} paragraphs.")

    return merged_segments