from typing import TypedDict, List
from pydantic import BaseModel, Field


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
    title: str = Field(description="The title of the reference source.")
    url: str = Field(description="The URL of the reference source.")


class GeneratedSectionModel(BaseModel):
    section_id: int = Field(description="The unique integer ID of the section, matching the section plan.")
    title: str = Field(description="The title of the section, matching the section plan.")
    content: str = Field(description="The complete and detailed study notes for this section in Markdown format. You MUST write the full generated notes content in this field. Do not leave it empty.")
    word_count: int = Field(description="The total word count of the generated content in the content field.")
    references: List[ReferenceModel] = Field(default=[], description="List of reference links. Leave empty since web search is disabled.")


class ChapterNotesModel(BaseModel):
    sections: List[GeneratedSectionModel] = Field(description="The list of generated note sections for the chapter.")