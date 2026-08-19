from typing import TypedDict, List
from pydantic import BaseModel


class Reference(TypedDict):
    """A reference link used in the generated notes."""
    title: str
    url: str


class GeneratedSection(TypedDict):
    """A single generated section of the lecture notes."""
    section_id: int
    title: str
    content: str
    word_count: int
    references: List[Reference]


class DraftNotes(TypedDict):
    """Draft notes consisting of multiple sections."""
    title: str
    content: str
    sections: List[GeneratedSection]


class ReferenceModel(BaseModel):
    title: str
    url: str


class GeneratedSectionModel(BaseModel):
    section_id: int
    title: str
    content: str
    word_count: int
    references: List[ReferenceModel]


class ChapterNotesModel(BaseModel):
    sections: List[GeneratedSectionModel]