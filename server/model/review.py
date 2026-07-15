from typing import TypedDict, List


class ReviewIssue(TypedDict):
    section_id: int
    severity: str
    category: str
    message: str
    suggestion: str


class ReviewResult(TypedDict):
    approved: bool
    retry_count: int
    failed_sections: List[ReviewIssue]