"""Admin endpoints - 管理画面用API"""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from src.deps import CurrentUser, DbSession
from src.models.card import Card, CardReview
from src.models.course import Course, Topic
from src.models.user import User
from src.plugins.registry import get_all_plugins, get_all_synergy_areas

router = APIRouter(prefix="/admin", tags=["admin"])


async def _require_admin(current_user) -> None:
    """管理者権限チェック"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者権限が必要です",
        )


@router.get("/stats")
async def get_system_stats(db: DbSession, current_user: CurrentUser):
    """システム統計情報"""
    await _require_admin(current_user)

    users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (
        await db.execute(
            select(func.count(User.id)).where(User.is_active.is_(True))
        )
    ).scalar() or 0
    courses_count = (await db.execute(select(func.count(Course.id)))).scalar() or 0
    topics_count = (await db.execute(select(func.count(Topic.id)))).scalar() or 0
    cards_count = (await db.execute(select(func.count(Card.id)))).scalar() or 0
    reviews_count = (
        await db.execute(select(func.count(CardReview.id)))
    ).scalar() or 0

    # プラグイン情報
    plugins = get_all_plugins()
    synergy_areas = get_all_synergy_areas()

    return {
        "users": {"total": users_count, "active": active_users},
        "content": {
            "courses": courses_count,
            "topics": topics_count,
            "cards": cards_count,
            "reviews": reviews_count,
        },
        "plugins": {
            "registered": len(plugins),
            "codes": list(plugins.keys()),
        },
        "synergy": {
            "total_areas": len(synergy_areas),
            "avg_overlap": (
                round(sum(a["overlap_pct"] for a in synergy_areas) / len(synergy_areas), 1)
                if synergy_areas
                else 0
            ),
        },
    }


@router.get("/users")
async def list_users(db: DbSession, current_user: CurrentUser):
    """ユーザー一覧"""
    await _require_admin(current_user)

    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    return {
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "display_name": u.display_name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": len(users),
    }


@router.get("/courses")
async def list_courses_with_plugins(db: DbSession, current_user: CurrentUser):
    """コース一覧 (DB + プラグイン情報)"""
    await _require_admin(current_user)

    # DB内のコース
    result = await db.execute(select(Course).order_by(Course.sort_order))
    db_courses = result.scalars().all()

    # プラグイン情報
    plugins = get_all_plugins()

    courses = []
    for course in db_courses:
        plugin = plugins.get(course.code)
        topic_count = (
            await db.execute(
                select(func.count(Topic.id)).where(Topic.course_id == course.id)
            )
        ).scalar() or 0
        card_count = (
            await db.execute(
                select(func.count(Card.id)).where(Card.course_id == course.id)
            )
        ).scalar() or 0

        courses.append(
            {
                "id": str(course.id),
                "code": course.code,
                "name": course.name,
                "color": course.color,
                "is_active": course.is_active,
                "topic_count": topic_count,
                "card_count": card_count,
                "has_plugin": plugin is not None,
                "plugin_info": (
                    {
                        "course_name": plugin.course_name,
                        "description": plugin.description,
                        "icon": plugin.icon,
                        "exam_questions": plugin.exam_config.total_questions,
                        "exam_duration_min": plugin.exam_config.duration_minutes,
                        "passing_score": plugin.exam_config.passing_score,
                        "synergy_count": len(plugin.get_synergy_areas()),
                    }
                    if plugin
                    else None
                ),
            }
        )

    # プラグインのみ (DBにまだ未登録)
    db_codes = {c.code for c in db_courses}
    for code, plugin in plugins.items():
        if code not in db_codes:
            courses.append(
                {
                    "id": None,
                    "code": code,
                    "name": plugin.course_name,
                    "color": plugin.color,
                    "is_active": False,
                    "topic_count": 0,
                    "card_count": 0,
                    "has_plugin": True,
                    "in_db": False,
                    "plugin_info": {
                        "course_name": plugin.course_name,
                        "description": plugin.description,
                        "icon": plugin.icon,
                        "exam_questions": plugin.exam_config.total_questions,
                        "exam_duration_min": plugin.exam_config.duration_minutes,
                        "passing_score": plugin.exam_config.passing_score,
                        "synergy_count": len(plugin.get_synergy_areas()),
                    },
                }
            )

    return {"courses": courses, "total": len(courses)}
