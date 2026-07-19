from tavily import TavilyClient

from server.config.settings import settings
from server.exceptions import NotesMakerError
from server.logger import get_logger

logger = get_logger(__name__)


class ResearchService:
    """
    Service responsible for retrieving external research
    for a lecture section using Tavily Search.
    """

    def __init__(self):
        logger.info("Initializing ResearchService.")

        api_key = settings.TAVILY_API_KEY

        if not api_key:
            raise NotesMakerError(
                message="TAVILY_API_KEY is not configured.",
                code="MISSING_TAVILY_API_KEY",
                status_code=500,
            )

        self.client = TavilyClient(api_key=api_key)

    def search(self, queries: list[str]) -> str:
        """
        Perform web research for the provided queries.

        Args:
            queries: List of search queries.

        Returns:
            Combined research text.
        """

        try:
            if not queries:
                logger.info("No research queries provided.")
                return ""

            logger.info(
                "Running Tavily search for %d queries.",
                len(queries),
            )

            research_chunks = []

            for query in queries:

                logger.info("Searching: %s", query)

                response = self.client.search(
                    query=query,
                    search_depth="advanced",
                    topic="general",
                    max_results=2,
                    include_answer=True,
                    include_raw_content=False,
                )

                print("========================================")
                print(response)
                print("========================================")

                if response.get("answer"):
                    research_chunks.append(
                        f"# Query\n{query}\n\n"
                        f"## AI Summary\n"
                        f"{response['answer']}\n"
                    )

                for result in response.get("results", []):

                    research_chunks.append(
                        "\n".join(
                            [
                                f"### Source: {result.get('title', '')}",
                                f"URL: {result.get('url', '')}",
                                result.get("content", ""),
                            ]
                        )
                    )

            logger.info("Research completed successfully.")

            return "\n\n".join(research_chunks)

        except Exception as e:
            logger.exception("Research service failed.")

            raise NotesMakerError(
                message="Failed to perform Tavily research.",
                code="RESEARCH_SERVICE_ERROR",
                status_code=500,
            ) from e