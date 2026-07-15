from typing import TypedDict, List


class GeneratedSection(TypedDict):
    section_id: int
    title: str
    content: str
    word_count: int
    references: List[str]


class DraftNotes(TypedDict):
    title: str
    content: str
    sections: List[GeneratedSection]


class FinalNotes(TypedDict):
    title: str
    content: str
    sections: List[GeneratedSection]