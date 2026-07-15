import logging
import logging.handlers
from pathlib import Path

# -----------------------------------------------------------------------------
# Log Directory
# -----------------------------------------------------------------------------

LOG_DIR = Path("logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOG_FILE = LOG_DIR / "notesmaker.log"

# -----------------------------------------------------------------------------
# Logger Configuration
# -----------------------------------------------------------------------------

LOGGER_NAME = "NotesMakerAI"

logger = logging.getLogger(LOGGER_NAME)

if not logger.handlers:
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(filename)s:%(lineno)d | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # Rotating File Handler
    file_handler = logging.handlers.RotatingFileHandler(
        filename=LOG_FILE,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    logger.propagate = False


def get_logger(name: str | None = None) -> logging.Logger:
    """
    Returns a child logger.

    Example:
        logger = get_logger(__name__)
    """
    if name:
        return logger.getChild(name)

    return logger