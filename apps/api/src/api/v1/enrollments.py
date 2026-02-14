"""Enrollment API - コース登録管理"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database import get_db
from src.models.enrollment import UserEnrollment
from src.models.course import Course

router = APIRouter(prefix="/enrollments", tags=["enrollments"])

DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class EnrollRequest(BaseModel):
    course_id: str
    desired_retention: float = 0.9


class UpdateRetentionRequest(BaseModel):
    desired_retention: float


@router.get("")
async def get_enrollments(db: AsyncSession = Depends(get_db)):
    """ユーザーの登録コース一覧"""
    result = await db.execute(
        select(UserEnrollment)
        .where(UserEnrollment.user_id == DEMO_USER_ID)
        .options(selectinload(UserEnrollment.course))
    )
    enrollments = result.scalars().all()

    return {
        "enrollments": [
            {
                "id": str(e.id),
                "course_id": str(e.course_id),
                "course_code": e.course.code if e.course else None,
                "course_name": e.course.name if e.course else None,
                "course_color": e.course.color if e.course else None,
                "desired_retention": float(e.desired_retention),
                "is_active": e.is_active,
                "enrolled_at": e.created_at.isoformat(),
            }
            for e in enrollments
        ],
        "total": len(enrollments),
    }


@router.post("")
async def enroll_course(
    req: EnrollRequest,
    db: AsyncSession = Depends(get_db),
):
    """コースに登録"""
    course_id = uuid.UUID(req.course_id)

    # コース存在確認
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="コースが見つかりません")

    # 重複チェック
    result = await db.execute(
        select(UserEnrollment).where(
            UserEnrollment.user_id == DEMO_USER_ID,
            UserEnrollment.course_id == course_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            existing.desired_retention = req.desired_retention
            return {"status": "re-enrolled", "enrollment_id": str(existing.id)}
        raise HTTPException(status_code=409, detail="既に登録済みです")

    enrollment = UserEnrollment(
        user_id=DEMO_USER_ID,
        course_id=course_id,
        desired_retention=req.desired_retention,
    )
    db.add(enrollment)
    await db.flush()

    return {
        "status": "enrolled",
        "enrollment_id": str(enrollment.id),
        "course_code": course.code,
    }


@router.put("/{enrollment_id}/retention")
async def update_retention(
    enrollment_id: str,
    req: UpdateRetentionRequest,
    db: AsyncSession = Depends(get_db),
):
    """目標記憶率の更新"""
    result = await db.execute(
        select(UserEnrollment).where(
            UserEnrollment.id == uuid.UUID(enrollment_id),
            UserEnrollment.user_id == DEMO_USER_ID,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="登録が見つかりません")

    if not 0.7 <= req.desired_retention <= 0.99:
        raise HTTPException(
            status_code=400, detail="目標記憶率は0.70〜0.99の範囲で指定してください"
        )

    enrollment.desired_retention = req.desired_retention
    return {
        "status": "updated",
        "desired_retention": float(enrollment.desired_retention),
    }


@router.delete("/{enrollment_id}")
async def unenroll_course(
    enrollment_id: str,
    db: AsyncSession = Depends(get_db),
):
    """コース登録を無効化（ソフトデリート）"""
    result = await db.execute(
        select(UserEnrollment).where(
            UserEnrollment.id == uuid.UUID(enrollment_id),
            UserEnrollment.user_id == DEMO_USER_ID,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="登録が見つかりません")

    enrollment.is_active = False
    return {"status": "unenrolled"}
