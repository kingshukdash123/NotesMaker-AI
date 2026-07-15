from typing import TypedDict, List


class Chunk(TypedDict):
    chunk_id: int
    text: str
    token_count: int


class ChunkSummary(TypedDict):
    chunk_id: int
    summary: str
    main_topic: str
    subtopics: List[str]
    concepts: List[str]
    keywords: List[str]
    research_hints: List[str]