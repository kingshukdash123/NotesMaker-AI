from typing import TypedDict, List


class SectionPlan(TypedDict):
    section_id: int
    title: str
    topics: List[str]
    # chunk_ids: List[int]
    research_required: bool
    diagram_required: bool
    table_required: bool
    example_required: bool
    target_word_count: int


class ExecutionPlan(TypedDict):
    note_style: str
    audience: str
    sections: List[SectionPlan]