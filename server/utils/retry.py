import time
from utils.logger import get_logger
from utils.exceptions import NotesMakerError

logger = get_logger(__name__)


def call_llm_with_retry(llm_callable, prompt_messages, max_retries=3, delay=25):
    """
    Invokes an LLM callable and automatically retries if a 429 or RESOURCE_EXHAUSTED 
    rate limit error is encountered, sleeping for the specified delay to clear 
    the rolling token-per-minute window.
    """
    for attempt in range(max_retries):
        try:
            return llm_callable.invoke(prompt_messages)
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                if attempt < max_retries - 1:
                    logger.warning(
                        "Rate limit hit (429/RESOURCE_EXHAUSTED) on attempt %d/%d. "
                        "Sleeping for %d seconds to clear the token window...",
                        attempt + 1,
                        max_retries,
                        delay,
                    )
                    time.sleep(delay)
                    continue
                else:
                    logger.error("Rate limit retry attempts exhausted. Raising generic rate limit exception.")
                    raise NotesMakerError(
                        message="The service is currently experiencing very high demand. Please wait a few moments and try again.",
                        code="RATE_LIMIT_EXHAUSTED",
                        status_code=429,
                    ) from e
            raise e
