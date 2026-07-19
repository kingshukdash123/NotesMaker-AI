import re
from pathlib import Path

def save_notes_to_output(title: str, content: str) -> Path:
    """
    Save the final notes content to a markdown file in the output folder.
    """
    # Sanitize the title to make a valid filename on Windows/Linux
    sanitized_title = re.sub(r'[\\/*?:"<>|]', "", title).strip()
    if not sanitized_title:
        sanitized_title = "lecture_notes"

    output_dir = Path("output")
    output_dir.mkdir(parents=True, exist_ok=True)

    file_path = output_dir / f"{sanitized_title}.md"
    file_path.write_text(content, encoding="utf-8")
    return file_path