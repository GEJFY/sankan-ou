"""MockExam schemas"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SubmitMockExamRequest(BaseModel):
    """模擬試験結果送信"""

    course_id: uuid.UUID
    course_code: str
    total_questions: int
    correct_count: int
    passing_score_pct: int
    time_taken_seconds: int
    question_ids: list[str]
    answer_indices: list[int | None]


class MockExamResultResponse(BaseModel):
    """模擬試験結果レスポンス"""

    id: uuid.UUID
    course_code: str
    score_pct: float
    correct_count: int
    total_questions: int
    passed: bool
    passing_score_pct: int
    time_taken_seconds: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MockExamHistoryResponse(BaseModel):
    """模擬試験履歴"""

    results: list[MockExamResultResponse]
    total_count: int
