from pydantic import BaseModel
from typing import TypedDict, List


class TopicNode(TypedDict):
    """A node representing a topic and its bullet points."""
    title: str
    bullets: List[str]

class LectureOutline(TypedDict):
    """A structured outline of a lecture."""
    title: str
    overview: str
    topic_hierarchy: List[TopicNode]
    learning_objectives: List[str]
    concepts: List[str]
    lecture_type: str
    difficulty: str


class TopicNodeModel(BaseModel):
    title: str
    bullets: List[str]

class LectureOutlineModel(BaseModel):
    title: str
    overview: str
    topic_hierarchy: List[TopicNodeModel]
    learning_objectives: List[str]
    concepts: List[str]
    lecture_type: str
    difficulty: str