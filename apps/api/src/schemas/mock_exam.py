"""MockExam schemas"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SubmitMockExamRequest(BaseModel):
    """模擬試験結果送信

    correct_count はクライアントの申告値を信用せず、サーバー側で
    question_ids + answer_indices から実際の正答数を再計算する
    (src/api/v1/mock_exam.py の submit_mock_exam を参照)。
    ここでのバリデーションは形式的な整合性のみを保証する。
    """

    course_id: uuid.UUID
    course_code: str
    total_questions: int = Field(ge=1, le=500)
    correct_count: int = Field(ge=0)
    passing_score_pct: int = Field(ge=0, le=100)
    time_taken_seconds: int = Field(ge=0)
    question_ids: list[str]
    answer_indices: list[int | None]

    @model_validator(mode="after")
    def _check_consistency(self) -> "SubmitMockExamRequest":
        if self.correct_count > self.total_questions:
            raise ValueError("correct_count が total_questions を超えています")
        if len(self.question_ids) != self.total_questions:
            raise ValueError("question_ids の件数が total_questions と一致しません")
        if len(self.answer_indices) != self.total_questions:
            raise ValueError("answer_indices の件数が total_questions と一致しません")
        return self


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
