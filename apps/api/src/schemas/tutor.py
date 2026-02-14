"""AI Tutor schemas"""

from pydantic import BaseModel, Field


class ExplainRequest(BaseModel):
    """解説リクエスト"""

    concept: str = Field(min_length=1, max_length=2000, description="解説してほしい概念")
    level: int = Field(default=4, ge=1, le=6, description="解説レベル (1=小学生 ~ 6=CPA)")
    course_codes: list[str] | None = Field(default=None, description="関連資格コード")


class CompareRequest(BaseModel):
    """3資格比較リクエスト"""

    concept: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    """チャットリクエスト"""

    message: str = Field(min_length=1, max_length=4000)
    level: int = Field(default=4, ge=1, le=6)
