import os
import logging
import logging.handlers
from pathlib import Path
import contextvars

# -----------------------------------------------------------------------------
# Log Directory & Mode Check
# -----------------------------------------------------------------------------

is_api_mode = os.environ.get("NOTESMAKER_MODE") == "API"

if not is_api_mode:
    LOG_DIR = Path("logs")
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    LOG_FILE = LOG_DIR / "notesmaker.log"

# -----------------------------------------------------------------------------
# Context Variables for Task Tracking
# -----------------------------------------------------------------------------

current_task_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "current_task_id", 
    default=None
)

# -----------------------------------------------------------------------------
# Task-specific Logging Handler
# -----------------------------------------------------------------------------

class TaskLogHandler(logging.Handler):
    """
    A custom logging handler that routes log records to the in-memory tasks
    dictionary in app.py if `current_task_id` context variable is set.
    """
    def emit(self, record):
        task_id = current_task_id.get(None)
        if task_id:
            try:
                from app import tasks
                if task_id in tasks:
                    msg = self.format(record)
                    if "logs" not in tasks[task_id]:
                        tasks[task_id]["logs"] = []
                    tasks[task_id]["logs"].append(msg)
            except Exception:
                self.handleError(record)

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
    logger.addHandler(console_handler)

    # Rotating File Handler (Only in Dev/Test mode)
    if not is_api_mode:
        file_handler = logging.handlers.RotatingFileHandler(
            filename=LOG_FILE,
            maxBytes=5 * 1024 * 1024,  # 5 MB
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    # Task Handler
    task_handler = TaskLogHandler()
    task_handler.setLevel(logging.INFO)
    task_handler.setFormatter(formatter)
    logger.addHandler(task_handler)

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