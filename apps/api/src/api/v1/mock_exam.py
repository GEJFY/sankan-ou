"""Mock Exam endpoints - 模擬試験"""

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from src.deps import CurrentUser, DbSession
from src.models.mock_exam import MockExamResult
from src.plugins.registry import get_plugin
from src.schemas.mock_exam import (
    MockExamHistoryResponse,
    MockExamResultResponse,
    SubmitMockExamRequest,
)

router = APIRouter(prefix="/mock-exam", tags=["mock-exam"])


class StartMockExamRequest(BaseModel):
    course_code: str = Field(description="CIA/CISA/CFE")
    section: int | None = Field(default=None, description="セクション番号 (None=全体)")
    question_count: int = Field(default=25, ge=5, le=100)


@router.post("/start")
async def start_mock_exam(body: StartMockExamRequest, db: DbSession):
    """模擬試験開始 - 試験形式でLLM問題生成"""
    plugin = get_plugin(body.course_code.upper())
    if plugin is None:
        return {"error": f"Course {body.course_code} not found"}

    config = plugin.exam_config
    sections = config.sections

    # セクション指定がある場合
    if body.section is not None and sections:
        filtered = [s for s in sections if s.get("part", s.get("section", s.get("domain"))) == body.section]
        section_name = filtered[0]["name"] if filtered else "全体"
    else:
        section_name = "全セクション"

    return {
        "exam_info": {
            "course_code": plugin.course_code,
            "course_name": plugin.course_name,
            "section": section_name,
            "total_questions": body.question_count,
            "duration_minutes": config.duration_minutes,
            "passing_score": config.passing_score * 100,
            "format_notes": config.format_notes,
        },
        "sections": sections,
        "status": "ready",
        "message": f"{plugin.course_code} 模擬試験 ({section_name}): {body.question_count}問",
    }


@router.get("/config/{course_code}")
async def get_exam_config(course_code: str):
    """試験設定取得"""
    plugin = get_plugin(course_code.upper())
    if plugin is None:
        return {"error": f"Course {course_code} not found"}

    return {
        "course_code": plugin.course_code,
        "course_name": plugin.course_name,
        "total_questions": plugin.exam_config.total_questions,
        "duration_minutes": plugin.exam_config.duration_minutes,
        "passing_score": plugin.exam_config.passing_score * 100,
        "sections": plugin.exam_config.sections,
        "format_notes": plugin.exam_config.format_notes,
    }


@router.post("/submit", response_model=MockExamResultResponse)
async def submit_mock_exam(
    body: SubmitMockExamRequest, db: DbSession, current_user: CurrentUser,
):
    """模擬試験結果を保存"""
    score_pct = (
        (body.correct_count / body.total_questions * 100)
        if body.total_questions > 0
        else 0
    )
    passed = score_pct >= body.passing_score_pct

    result = MockExamResult(
        user_id=current_user.id,
        course_id=body.course_id,
        course_code=body.course_code.upper(),
        score_pct=round(score_pct, 2),
        correct_count=body.correct_count,
        total_questions=body.total_questions,
        passed=passed,
        passing_score_pct=body.passing_score_pct,
        time_taken_seconds=body.time_taken_seconds,
        question_ids=body.question_ids,
        answer_indices=body.answer_indices,
    )
    db.add(result)
    await db.flush()
    await db.commit()
    await db.refresh(result)
    return result


@router.get("/history", response_model=MockExamHistoryResponse)
async def get_mock_exam_history(
    db: DbSession,
    current_user: CurrentUser,
    course_code: str | None = None,
    limit: int = Query(default=20, le=100),
):
    """模擬試験履歴取得"""
    base_filter = MockExamResult.user_id == current_user.id
    if course_code:
        base_filter = base_filter & (MockExamResult.course_code == course_code.upper())

    total = (
        await db.execute(
            select(func.count(MockExamResult.id)).where(base_filter)
        )
    ).scalar() or 0

    rows = (
        await db.execute(
            select(MockExamResult)
            .where(base_filter)
            .order_by(MockExamResult.created_at.desc())
            .limit(limit)
        )
    ).scalars().all()

    return MockExamHistoryResponse(results=rows, total_count=total)
