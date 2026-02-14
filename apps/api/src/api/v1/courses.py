"""Course endpoints"""

from fastapi import APIRouter
from sqlalchemy import select

from src.deps import DbSession
from src.models.course import Course
from src.schemas.course import CourseListResponse, CourseOut

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
