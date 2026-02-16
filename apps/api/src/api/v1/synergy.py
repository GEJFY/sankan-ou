"""Synergy endpoints - 資格間シナジー情報"""

from datetime import datetime, timezone

from fastapi import APIRouter, Query
from sqlalchemy import select

from src.deps import DbSession
from src.models.card import Card, CardReview
from src.models.course import Course, Topic
from src.plugins.registry import get_all_plugins, get_all_synergy_areas, get_plugin

router = APIRouter(prefix="/synergy", tags=["synergy"])


@router.get("/areas")
async def get_synergy_areas():
    """全資格間のシナジー領域一覧"""
    areas = get_all_synergy_areas()
    return {"synergy_areas": areas, "total": len(areas)}


@router.get("/course/{course_code}")
async def get_course_plugin_info(course_code: str):
    """コースプラグイン詳細情報"""
    plugin = get_plugin(course_code.upper())
    if plugin is None:
        return {"error": f"Course {course_code} not found"}

    syllabus = plugin.get_syllabus()
    synergy = plugin.get_synergy_areas()

    return {
        "course_code": plugin.course_code,
        "course_name": plugin.course_name,
        "description": plugin.description,
        "color": plugin.color,
        "icon": plugin.icon,
        "exam_config": {
            "total_questions": plugin.exam_config.total_questions,
            "duration_minutes": plugin.exam_config.duration_minutes,
            "passing_score": plugin.exam_config.passing_score,
            "sections": plugin.exam_config.sections,
        },
        "syllabus": [
            {
                "name": t.name,
                "weight_pct": t.weight_pct,
                "children": [
                    {
                        "name": c.name,
                        "weight_pct": c.weight_pct,
                        "keywords": c.keywords,
                    }
                    for c in t.children
                ],
            }
            for t in syllabus
        ],
        "synergy_areas": [
            {
                "area_name": s.area_name,
                "overlap_pct": s.overlap_pct,
                "related_courses": s.related_courses,
                "term_mappings": s.term_mappings,
            }
            for s in synergy
        ],
    }


@router.get("/study")
async def get_synergy_study_cards(
    db: DbSession,
    area: str = Query(None, description="シナジー領域名でフィルタ"),
    limit: int = Query(10, ge=1, le=50),
):
    """シナジー学習カード取得 - 共通テーマで横断出題"""
    now = datetime.now(timezone.utc)

    # is_synergy=True のカードを取得
    stmt = (
        select(Card)
        .where(Card.is_synergy.is_(True))
        .limit(limit)
    )
    result = await db.execute(stmt)
    synergy_cards = list(result.scalars().all())

    # 通常カードも含めて3資格からバランスよく取得
    if len(synergy_cards) < limit:
        remaining = limit - len(synergy_cards)
        # 各コースから均等に
        courses_result = await db.execute(select(Course))
        courses = list(courses_result.scalars().all())

        per_course = max(1, remaining // len(courses)) if courses else remaining
        for course in courses:
            stmt = (
                select(Card)
                .where(Card.course_id == course.id)
                .where(Card.is_synergy.is_(False))
                .limit(per_course)
            )
            r = await db.execute(stmt)
            synergy_cards.extend(r.scalars().all())

    cards_out = []
    for card in synergy_cards[:limit]:
        # コース情報取得
        course = await db.get(Course, card.course_id)
        cards_out.append(
            {
                "id": str(card.id),
                "front": card.front,
                "back": card.back,
                "course_code": course.code if course else "N/A",
                "course_color": course.color if course else "#666",
                "is_synergy": card.is_synergy,
                "difficulty_tier": card.difficulty_tier,
                "tags": card.tags,
            }
        )

    return {"cards": cards_out, "total": len(cards_out)}


@router.get("/overview")
async def get_synergy_overview():
    """3資格シナジー概要 - 全体の重複状況"""
    plugins = get_all_plugins()
    areas = get_all_synergy_areas()

    overview = {
        "courses": [
            {
                "code": p.course_code,
                "name": p.course_name,
                "color": p.color,
                "icon": p.icon,
                "exam_questions": p.exam_config.total_questions,
                "exam_duration_min": p.exam_config.duration_minutes,
                "passing_score": p.exam_config.passing_score,
            }
            for p in plugins.values()
        ],
        "synergy_areas": areas,
        "total_synergy_areas": len(areas),
        "avg_overlap_pct": (
            sum(a["overlap_pct"] for a in areas) / len(areas) if areas else 0
        ),
        "learning_efficiency": "3資格の約40%の知識が共通。効率的な同時学習が可能。",
    }
    return overview
