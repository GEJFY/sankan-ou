"""Course schemas"""

import uuid

from pydantic import BaseModel


class CourseOut(BaseModel):
    """コース情報レスポンス"""

    id: uuid.UUID
    code: str
    name: str
    description: str
    color: str
    is_active: bool

    model_config = {"from_attributes": True}


class CourseListResponse(BaseModel):
    """コース一覧"""

    courses: list[CourseOut]


class TopicOut(BaseModel):
    """トピック情報レスポンス"""

    id: uuid.UUID
    name: str
    course_id: uuid.UUID
    parent_id: uuid.UUID | None = None
    level: int = 0
    weight_pct: float = 0.0

    model_config = {"from_attributes": True}


class TopicListResponse(BaseModel):
    """トピック一覧"""

    topics: list[TopicOut]
