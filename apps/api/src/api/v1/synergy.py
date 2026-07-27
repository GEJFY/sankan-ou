"""Synergy endpoints - 資格間シナジー情報"""


from fastapi import APIRouter, Query
from sqlalchemy import func, select

from src.deps import CurrentUser, DbSession
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
    course_code: str = Query(None, description="資格コードでフィルタ (CIA/CISA/CFE)"),
    limit: int = Query(10, ge=1, le=50),
):
    """シナジー学習カード取得 - 共通テーマで横断出題"""
    # コースフィルタ用のcourse_idを取得
    filter_course_ids: list | None = None
    if course_code:
        codes = [c.strip().upper() for c in course_code.split(",")]
        courses_result = await db.execute(
            select(Course).where(Course.code.in_(codes))
        )
        filter_course_ids = [c.id for c in courses_result.scalars().all()]

    # is_synergy=True のカードを取得
    stmt = select(Card).where(Card.is_synergy.is_(True))
    if filter_course_ids is not None:
        stmt = stmt.where(Card.course_id.in_(filter_course_ids))
    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    synergy_cards = list(result.scalars().all())

    # 通常カードも含めてバランスよく取得
    if len(synergy_cards) < limit:
        remaining = limit - len(synergy_cards)
        if filter_course_ids is not None:
            courses_result = await db.execute(
                select(Course).where(Course.id.in_(filter_course_ids))
            )
        else:
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


@router.get("/matrix")
async def get_synergy_matrix(db: DbSession, current_user: CurrentUser):
    """カリキュラム横並び分析 - シナジー領域ごとに資格を横並びにし、
    ユーザーの習熟度から「重複学習をどれだけ節約できるか」を示す"""
    areas = get_all_synergy_areas()

    rows = []
    for area in areas:
        course_cells = []
        masteries: dict[str, float] = {}
        for code, topic_name in area.get("topic_names", {}).items():
            course = (
                await db.execute(select(Course).where(Course.code == code))
            ).scalar_one_or_none()
            if not course:
                continue
            topic = (
                await db.execute(
                    select(Topic).where(
                        Topic.course_id == course.id, Topic.name == topic_name
                    )
                )
            ).scalar_one_or_none()

            mastery_score = 0.0
            reviewed_count = 0
            if topic:
                stats = (
                    await db.execute(
                        select(
                            func.count(CardReview.id),
                            func.coalesce(func.sum(CardReview.lapses), 0),
                        )
                        .select_from(Card)
                        .join(
                            CardReview,
                            (CardReview.card_id == Card.id)
                            & (CardReview.user_id == current_user.id),
                        )
                        .where(Card.topic_id == topic.id)
                    )
                ).one()
                reviewed_count = stats[0] or 0
                lapses = stats[1] or 0
                if reviewed_count > 0:
                    mastery_score = max(0.0, 1.0 - (lapses / (reviewed_count * 3)))

            masteries[code] = mastery_score
            course_cells.append(
                {
                    "course_code": code,
                    "topic_name": topic_name,
                    "term": area.get("term_mappings", {}).get(code, ""),
                    "mastery_score": round(mastery_score, 4),
                    "reviewed_count": reviewed_count,
                }
            )

        # 効率化のヒント: 1資格で既に高習熟(>=0.6)、他資格でまだ低い(<0.3)場合は
        # 「そちらは軽い確認で十分」というメッセージを出す
        efficiency_tip = None
        strong = [c for c in course_cells if c["mastery_score"] >= 0.6]
        weak = [c for c in course_cells if c["mastery_score"] < 0.3]
        if strong and weak and len(course_cells) > 1:
            strong_codes = "・".join(c["course_code"] for c in strong)
            weak_codes = "・".join(c["course_code"] for c in weak)
            efficiency_tip = (
                f"{strong_codes}で既にこの領域を習得済みです。{weak_codes}では"
                "同じ概念の用語の違いだけ確認すれば、ゼロから学ぶより短時間で済みます。"
            )

        rows.append(
            {
                "area_name": area["area_name"],
                "overlap_pct": area["overlap_pct"],
                "description": area.get("description", ""),
                "courses": course_cells,
                "efficiency_tip": efficiency_tip,
            }
        )

    return {"matrix": rows, "total_areas": len(rows)}


@router.get("/overview")
async def get_synergy_overview():
    """全資格シナジー概要 - 全体の重複状況"""
    plugins = get_all_plugins()
    areas = get_all_synergy_areas()
    num_courses = len(plugins)

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
        "learning_efficiency": f"{num_courses}資格の共通知識を活用した効率的な同時学習が可能。",
    }
    return overview
