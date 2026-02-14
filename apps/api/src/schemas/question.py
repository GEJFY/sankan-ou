"""Question schemas"""

import uuid

from pydantic import BaseModel, Field


class GenerateQuestionsRequest(BaseModel):
    """問題生成リクエスト"""

    topic_id: uuid.UUID
    count: int = Field(default=3, ge=1, le=10)
    difficulty: int = Field(default=2, ge=1, le=5)


class ChoiceOut(BaseModel):
    text: str
    is_correct: bool
    explanation: str


class QuestionOut(BaseModel):
    id: uuid.UUID
    stem: str
    choices: list[ChoiceOut]
    explanation: str
    difficulty: int
    course_code: str

    model_config = {"from_attributes": True}


class GenerateQuestionsResponse(BaseModel):
    questions: list[QuestionOut]


class AnswerRequest(BaseModel):
    question_id: uuid.UUID
    selected_index: int = Field(ge=0, le=3)
    response_time_ms: int = Field(default=0, ge=0)


class AnswerResponse(BaseModel):
    is_correct: bool
    correct_index: int
    explanation: str
