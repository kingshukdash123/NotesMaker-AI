from server.logger import get_logger
from server.model.transcript import TranscriptSegment

logger = get_logger(__name__)

# Approximate number of words in one merged paragraph
MAX_WORDS = 150


def merge_transcript(
    transcript: list[TranscriptSegment],
) -> list[TranscriptSegment]:
    """
    Merge small transcript segments into larger paragraphs.
    """

    logger.info("Merging transcript segments...")

    merged_segments: list[TranscriptSegment] = []

    current_text = []
    current_start = None
    current_end = None
    word_count = 0

    for segment in transcript:

        words = segment["text"].split()

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