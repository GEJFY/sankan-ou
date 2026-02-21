"""Course endpoints"""

from fastapi import APIRouter
from sqlalchemy import select

from src.deps import DbSession
from src.models.course import Course, Topic
from src.schemas.course import (
    CourseListResponse,
    CourseOut,
    TopicListResponse,
    TopicOut,
)

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=CourseListResponse)
async def list_courses(db: DbSession) -> CourseListResponse:
    """コース一覧取得"""
    stmt = select(Course).where(Course.is_active == True).order_by(Course.sort_order)  # noqa: E712
    result = await db.execute(stmt)
    courses = result.scalars().all()
    return CourseListResponse(
        courses=[CourseOut.model_validate(c) for c in courses]
    )


@router.get("/{course_id}", response_model=CourseOut)
async def get_course(course_id: str, db: DbSession) -> CourseOut:
    """コース詳細取得"""
    stmt = select(Course).where(Course.id == course_id)
    result = await db.execute(stmt)
    course = result.scalar_one()
    return CourseOut.model_validate(course)


@router.get("/{course_id}/topics", response_model=TopicListResponse)
async def list_topics(course_id: str, db: DbSession) -> TopicListResponse:
    """コース別トピック一覧取得（子トピックのみ = level 1）"""
    stmt = (
        select(Topic)
        .where(Topic.course_id == course_id)
        .where(Topic.level == 1)
        .order_by(Topic.sort_order)
    )
    result = await db.execute(stmt)
    topics = result.scalars().all()
    return TopicListResponse(
        topics=[TopicOut.model_validate(t) for t in topics]
    )
