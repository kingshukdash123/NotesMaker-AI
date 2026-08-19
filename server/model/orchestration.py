from pydantic import BaseModel
from model.outline import LectureOutlineModel
from model.execution import ExecutionPlanModel


class OrchestrationResultModel(BaseModel):
    outline: LectureOutlineModel
    execution_plan: ExecutionPlanModel
