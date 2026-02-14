"""Gamification service - XP, badges, daily missions"""

import random
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.gamification import Badge, DailyMission, UserBadge, UserXP, XPLog

# XP配分テーブル
XP_TABLE = {
    "review_again": 5,
    "review_hard": 10,
    "review_good": 15,
    "review_easy": 25,
    "quiz_correct": 20,
    "synergy_bonus": 10,
    "streak_bonus": 50,    # 連続ログインボーナス
    "mission_complete": 0,  # ミッション報酬はミッション定義に従う
}

# レベル閾値 (累積XP)
LEVEL_THRESHOLDS = [
    0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200,     # Lv1-10
    6600, 8200, 10000, 12000, 14500, 17500, 21000, 25000, 30000, 36000,  # Lv11-20
    43000, 51000, 60000, 70000, 82000, 96000, 112000, 130000, 150000, 175000,  # Lv21-30
]

# デフォルトバッジ定義
DEFAULT_BADGES = [
    {
        "code": "first_review",
        "name": "はじめの一歩",
        "description": "初めてカードをレビューした",
        "icon": "🎯",
        "category": "volume",
        "condition": {"type": "reviews", "count": 1},
        "xp_reward": 20,
    },
    {
        "code": "reviews_50",
        "name": "勤勉な学習者",
        "description": "カード50枚をレビュー達成",
        "icon": "📚",
        "category": "volume",
        "condition": {"type": "reviews", "count": 50},
        "xp_reward": 100,
    },
    {
        "code": "reviews_100",
        "name": "百枚マスター",
        "description": "カード100枚をレビュー達成",
        "icon": "💯",
        "category": "volume",
        "condition": {"type": "reviews", "count": 100},
        "xp_reward": 200,
    },
    {
        "code": "reviews_500",
        "name": "知識の探求者",
        "description": "カード500枚をレビュー達成",
        "icon": "🏆",
        "category": "volume",
        "condition": {"type": "reviews", "count": 500},
        "xp_reward": 500,
    },
    {
        "code": "streak_3",
        "name": "3日連続",
        "description": "3日連続で学習を継続",
        "icon": "🔥",
        "category": "streak",
        "condition": {"type": "streak", "days": 3},
        "xp_reward": 50,
    },
    {
        "code": "streak_7",
        "name": "ウィークリーチャンピオン",
        "description": "7日連続で学習を継続",
        "icon": "⭐",
        "category": "streak",
        "condition": {"type": "streak", "days": 7},
        "xp_reward": 150,
    },
    {
        "code": "streak_30",
        "name": "月間マスター",
        "description": "30日連続で学習を継続",
        "icon": "👑",
        "category": "streak",
        "condition": {"type": "streak", "days": 30},
        "xp_reward": 500,
    },
    {
        "code": "synergy_first",
        "name": "シナジー入門",
        "description": "初めてシナジーカードをレビューした",
        "icon": "🔗",
        "category": "synergy",
        "condition": {"type": "synergy_reviews", "count": 1},
        "xp_reward": 30,
    },
    {
        "code": "triple_crown",
        "name": "三冠王",
        "description": "3資格すべてでカードをレビューした",
        "icon": "🏅",
        "category": "mastery",
        "condition": {"type": "triple_course"},
        "xp_reward": 200,
    },
    {
        "code": "perfect_session",
        "name": "パーフェクト",
        "description": "1セッションで全問Good以上",
        "icon": "💎",
        "category": "mastery",
        "condition": {"type": "perfect_session", "min_cards": 10},
        "xp_reward": 100,
    },
]

# デイリーミッションテンプレート
MISSION_TEMPLATES = [
    {"type": "review_cards", "title": "カードを{n}枚レビューしよう", "target": 10, "xp": 30},
    {"type": "review_cards", "title": "カードを{n}枚レビューしよう", "target": 20, "xp": 50},
    {"type": "review_good", "title": "Good以上で{n}枚回答しよう", "target": 5, "xp": 30},
    {"type": "review_good", "title": "Good以上で{n}枚回答しよう", "target": 10, "xp": 50},
    {"type": "synergy_study", "title": "シナジーカードを{n}枚学習しよう", "target": 5, "xp": 40},
    {"type": "multi_course", "title": "{n}つの資格のカードをレビューしよう", "target": 2, "xp": 35},
    {"type": "multi_course", "title": "3つの資格のカードをレビューしよう", "target": 3, "xp": 60},
    {"type": "speed_review", "title": "{n}枚を10分以内にレビューしよう", "target": 15, "xp": 45},
]


def _calc_level(total_xp: int) -> int:
    """累積XPからレベルを算出"""
    for i in range(len(LEVEL_THRESHOLDS) - 1, -1, -1):
        if total_xp >= LEVEL_THRESHOLDS[i]:
            return i + 1
    return 1


def _xp_for_next_level(level: int) -> int:
    """次のレベルに必要な累積XP"""
    if level < len(LEVEL_THRESHOLDS):
        return LEVEL_THRESHOLDS[level]
    return LEVEL_THRESHOLDS[-1] + (level - len(LEVEL_THRESHOLDS)) * 30000


class GamificationService:
    """XP・レベル・バッジ・ミッション管理"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_xp(self, user_id: uuid.UUID) -> UserXP:
        """ユーザーXPレコード取得（なければ作成）"""
        result = await self.db.execute(
            select(UserXP).where(UserXP.user_id == user_id)
        )
        xp = result.scalar_one_or_none()
        if not xp:
            xp = UserXP(user_id=user_id)
            self.db.add(xp)
            await self.db.flush()
        return xp

    async def award_xp(
        self,
        user_id: uuid.UUID,
        amount: int,
        source: str,
        detail: str | None = None,
        course_code: str | None = None,
    ) -> dict:
        """XP付与 + レベルアップ判定"""
        xp = await self.get_or_create_xp(user_id)
        old_level = xp.level

        xp.total_xp += amount
        # 資格別XP
        if course_code == "CIA":
            xp.cia_xp += amount
        elif course_code == "CISA":
            xp.cisa_xp += amount
        elif course_code == "CFE":
            xp.cfe_xp += amount

        xp.level = _calc_level(xp.total_xp)

        # ログ記録
        log = XPLog(user_id=user_id, amount=amount, source=source, detail=detail)
        self.db.add(log)

        leveled_up = xp.level > old_level
        return {
            "xp_gained": amount,
            "total_xp": xp.total_xp,
            "level": xp.level,
            "leveled_up": leveled_up,
            "xp_to_next": _xp_for_next_level(xp.level) - xp.total_xp,
        }

    async def award_review_xp(
        self,
        user_id: uuid.UUID,
        rating: int,
        course_code: str | None = None,
        is_synergy: bool = False,
    ) -> dict:
        """レビュー評価に基づくXP付与"""
        source_map = {1: "review_again", 2: "review_hard", 3: "review_good", 4: "review_easy"}
        source = source_map.get(rating, "review_good")
        amount = XP_TABLE[source]

        if is_synergy:
            amount += XP_TABLE["synergy_bonus"]

        return await self.award_xp(user_id, amount, source, course_code=course_code)

    async def get_user_profile(self, user_id: uuid.UUID) -> dict:
        """ユーザーのゲーミフィケーションプロフィール"""
        xp = await self.get_or_create_xp(user_id)

        # 獲得バッジ
        result = await self.db.execute(
            select(UserBadge).where(UserBadge.user_id == user_id)
        )
        user_badges = result.scalars().all()

        # 今日のミッション
        missions = await self.get_daily_missions(user_id)

        return {
            "total_xp": xp.total_xp,
            "level": xp.level,
            "xp_to_next": _xp_for_next_level(xp.level) - xp.total_xp,
            "xp_progress_pct": (
                (xp.total_xp - _xp_for_next_level(xp.level - 1))
                / max(1, _xp_for_next_level(xp.level) - _xp_for_next_level(xp.level - 1))
                * 100
            )
            if xp.level > 1
            else (xp.total_xp / max(1, _xp_for_next_level(1))) * 100,
            "course_xp": {
                "CIA": xp.cia_xp,
                "CISA": xp.cisa_xp,
                "CFE": xp.cfe_xp,
            },
            "badges": [
                {
                    "code": ub.badge.code,
                    "name": ub.badge.name,
                    "icon": ub.badge.icon,
                    "earned_at": ub.earned_at.isoformat(),
                }
                for ub in user_badges
                if ub.badge
            ],
            "badge_count": len(user_badges),
            "daily_missions": missions,
        }

    async def get_daily_missions(self, user_id: uuid.UUID) -> list[dict]:
        """今日のデイリーミッション取得（なければ生成）"""
        today = date.today()
        result = await self.db.execute(
            select(DailyMission).where(
                DailyMission.user_id == user_id,
                DailyMission.mission_date == today,
            )
        )
        missions = result.scalars().all()

        if not missions:
            missions = await self._generate_daily_missions(user_id, today)

        return [
            {
                "id": str(m.id),
                "type": m.mission_type,
                "title": m.title,
                "target": m.target_value,
                "current": m.current_value,
                "xp_reward": m.xp_reward,
                "is_completed": m.is_completed,
                "progress_pct": min(100, int(m.current_value / max(1, m.target_value) * 100)),
            }
            for m in missions
        ]

    async def _generate_daily_missions(
        self, user_id: uuid.UUID, mission_date: date
    ) -> list[DailyMission]:
        """デイリーミッション自動生成（3つ）"""
        templates = random.sample(MISSION_TEMPLATES, min(3, len(MISSION_TEMPLATES)))
        missions = []
        for tmpl in templates:
            title = tmpl["title"].replace("{n}", str(tmpl["target"]))
            m = DailyMission(
                user_id=user_id,
                mission_date=mission_date,
                mission_type=tmpl["type"],
                title=title,
                target_value=tmpl["target"],
                xp_reward=tmpl["xp"],
            )
            self.db.add(m)
            missions.append(m)
        await self.db.flush()
        return missions

    async def update_mission_progress(
        self,
        user_id: uuid.UUID,
        mission_type: str,
        increment: int = 1,
    ) -> list[dict]:
        """ミッション進捗更新 + 完了判定"""
        today = date.today()
        result = await self.db.execute(
            select(DailyMission).where(
                DailyMission.user_id == user_id,
                DailyMission.mission_date == today,
                DailyMission.mission_type == mission_type,
                DailyMission.is_completed == False,
            )
        )
        missions = result.scalars().all()
        completed = []

        for m in missions:
            m.current_value += increment
            if m.current_value >= m.target_value and not m.is_completed:
                m.is_completed = True
                m.completed_at = datetime.now(timezone.utc)
                # ミッション完了XP
                await self.award_xp(user_id, m.xp_reward, "mission_complete", detail=m.title)
                completed.append({"title": m.title, "xp_reward": m.xp_reward})

        return completed

    async def check_and_award_badges(
        self,
        user_id: uuid.UUID,
        total_reviews: int = 0,
        streak_days: int = 0,
        synergy_reviews: int = 0,
        courses_studied: list[str] | None = None,
    ) -> list[dict]:
        """バッジ獲得条件チェック + 付与"""
        # 既に獲得済みバッジ
        result = await self.db.execute(
            select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
        )
        earned_ids = {row[0] for row in result.all()}

        # 全バッジ取得
        result = await self.db.execute(select(Badge))
        all_badges = result.scalars().all()

        newly_earned = []
        for badge in all_badges:
            if badge.id in earned_ids:
                continue

            earned = False
            cond = badge.condition

            if cond.get("type") == "reviews" and total_reviews >= cond.get("count", 0):
                earned = True
            elif cond.get("type") == "streak" and streak_days >= cond.get("days", 0):
                earned = True
            elif cond.get("type") == "synergy_reviews" and synergy_reviews >= cond.get("count", 0):
                earned = True
            elif cond.get("type") == "triple_course" and courses_studied and len(set(courses_studied)) >= 3:
                earned = True

            if earned:
                ub = UserBadge(user_id=user_id, badge_id=badge.id)
                self.db.add(ub)
                await self.award_xp(user_id, badge.xp_reward, "badge_earned", detail=badge.name)
                newly_earned.append({
                    "code": badge.code,
                    "name": badge.name,
                    "icon": badge.icon,
                    "xp_reward": badge.xp_reward,
                })

        return newly_earned

    async def get_xp_history(self, user_id: uuid.UUID, limit: int = 20) -> list[dict]:
        """XP獲得履歴"""
        result = await self.db.execute(
            select(XPLog)
            .where(XPLog.user_id == user_id)
            .order_by(XPLog.earned_at.desc())
            .limit(limit)
        )
        logs = result.scalars().all()
        return [
            {
                "amount": log.amount,
                "source": log.source,
                "detail": log.detail,
                "earned_at": log.earned_at.isoformat(),
            }
            for log in logs
        ]

    async def get_leaderboard(self, limit: int = 10) -> list[dict]:
        """XPリーダーボード"""
        result = await self.db.execute(
            select(UserXP).order_by(UserXP.total_xp.desc()).limit(limit)
        )
        entries = result.scalars().all()
        return [
            {
                "rank": i + 1,
                "user_id": str(e.user_id),
                "total_xp": e.total_xp,
                "level": e.level,
            }
            for i, e in enumerate(entries)
        ]


async def seed_badges(db: AsyncSession) -> None:
    """デフォルトバッジをDBに投入"""
    for badge_def in DEFAULT_BADGES:
        result = await db.execute(
            select(Badge).where(Badge.code == badge_def["code"])
        )
        if not result.scalar_one_or_none():
            badge = Badge(**badge_def)
            db.add(badge)
    await db.commit()
