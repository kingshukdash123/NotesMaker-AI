from typing import TypedDict, List, Optional, NotRequired
from pydantic import BaseModel, Field


class SectionPlan(TypedDict):
    section_id: int
    title: str
    topics: List[str]
    # chunk_ids: List[int]
    research_required: bool
    research_query: NotRequired[Optional[List[str]]]
    diagram_required: bool
    table_required: bool
    example_required: bool
    target_word_count: int


class ExecutionPlan(TypedDict):
    note_style: str
    audience: str
    sections: List[SectionPlan]


class SectionPlanModel(BaseModel):
    section_id: int
    title: str
    topics: List[str]
    research_required: bool
    research_query: Optional[List[str]] = Field(default=None)
    diagram_required: bool
    table_required: bool
    example_required: bool
    target_word_count: int


class ExecutionPlanModel(BaseModel):
    note_style: str
    audience: str
    sections: List[SectionPlanModel]