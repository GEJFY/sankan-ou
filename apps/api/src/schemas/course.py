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
