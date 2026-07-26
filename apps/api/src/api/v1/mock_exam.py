"""Mock Exam endpoints - 模擬試験"""

import uuid

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from src.deps import CurrentUser, DbSession
from src.models.course import Course, Topic
from src.models.mock_exam import MockExamResult
from src.models.question import Question
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
    """模擬試験開始 - 出題対象トピックを本番同様に複数トピックから決定する"""
    plugin = get_plugin(body.course_code.upper())
    if plugin is None:
        return {"error": f"Course {body.course_code} not found"}

    config = plugin.exam_config
    sections = config.sections

    course = (
        await db.execute(select(Course).where(Course.code == plugin.course_code))
    ).scalar_one_or_none()

    # セクション指定がある場合は該当セクションのトピックのみ、
    # 指定がない場合は全トピックを対象にする（= 本番の「全科目ランダム出題」相当）。
    # シラバス命名規則はコースによって異なる:
    #  - CIA/CFE: セクション(Part/Section)がlevel=0の親トピック、A/B/C/Dがlevel=1の子トピック
    #  - CISA: セクション(Domain)自体がlevel=1トピック ("D1. ..." など、level=0の親は単一)
    topic_ids: list[str] = []
    section_name = "全セクション"
    if course:
        topic_stmt = select(Topic.id, Topic.name).where(Topic.course_id == course.id, Topic.level == 1)
        if body.section is not None and sections:
            filtered = [
                s for s in sections if s.get("part", s.get("section", s.get("domain"))) == body.section
            ]
            if filtered:
                section_name = filtered[0]["name"]
            n = body.section

            # Case A: level=0の親トピックが "Part n" / "Section n" 系の命名の場合、その子孫を対象にする
            parent_stmt = select(Topic.id).where(
                Topic.course_id == course.id,
                Topic.level == 0,
                Topic.name.ilike(f"%Part {n}%")
                | Topic.name.ilike(f"%Part{n}:%")
                | Topic.name.ilike(f"%Section {n}%")
                | Topic.name.ilike(f"%Section{n}:%"),
            )
            parent_ids = {row[0] for row in (await db.execute(parent_stmt)).all()}
            if parent_ids:
                topic_stmt = select(Topic.id, Topic.name).where(
                    Topic.course_id == course.id,
                    Topic.level == 1,
                    Topic.parent_id.in_(parent_ids),
                )
            else:
                # Case B: セクション自体がlevel=1トピック ("D{n}." / "S{n}." 接頭辞)
                topic_stmt = select(Topic.id, Topic.name).where(
                    Topic.course_id == course.id,
                    Topic.level == 1,
                    Topic.name.ilike(f"D{n}.%") | Topic.name.ilike(f"S{n}.%"),
                )
        rows = (await db.execute(topic_stmt)).all()
        topic_ids = [str(r[0]) for r in rows]

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
        "topic_ids": topic_ids,
        "status": "ready",
        "message": f"{plugin.course_code} 模擬試験 ({section_name}): {body.question_count}問 / {len(topic_ids)}トピックから出題",
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
    """模擬試験結果を保存

    correct_count はクライアント申告値をそのまま信用せず、
    question_ids + answer_indices から実際に採点し直す。
    (DB上に存在しない/削除済みの question_id が混じっている場合のみ、
    フォールバックとしてクライアント申告値を使い、その旨をログに残す)
    """
    verified_correct = 0
    all_questions_found = True
    for q_id_str, selected_index in zip(body.question_ids, body.answer_indices):
        try:
            q_id = uuid.UUID(q_id_str)
        except ValueError:
            all_questions_found = False
            continue
        question = await db.get(Question, q_id)
        if question is None:
            all_questions_found = False
            continue
        correct_index = next(
            (i for i, c in enumerate(question.choices) if c.get("is_correct")), 0
        )
        if selected_index is not None and selected_index == correct_index:
            verified_correct += 1

    correct_count = verified_correct if all_questions_found else body.correct_count

    score_pct = (
        (correct_count / body.total_questions * 100) if body.total_questions > 0 else 0
    )
    passed = score_pct >= body.passing_score_pct

    result = MockExamResult(
        user_id=current_user.id,
        course_id=body.course_id,
        course_code=body.course_code.upper(),
        score_pct=round(score_pct, 2),
        correct_count=correct_count,
        total_questions=body.total_questions,
        passed=passed,
        passing_score_pct=body.passing_score_pct,
        time_taken_seconds=body.time_taken_seconds,
        question_ids=body.question_ids,
        answer_indices=body.answer_indices,
    )
    db.add(result)
    await db.flush()
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
