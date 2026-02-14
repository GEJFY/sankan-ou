"""Study Session + Score Prediction サービス"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.card import Card, CardReview, ReviewLog
from src.models.course import Course, Topic
from src.models.mastery import ScorePrediction, StudySession, UserTopicMastery


class SessionService:
    """学習セッション管理"""

    async def start_session(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
        session_type: str = "review",
    ) -> StudySession:
        """セッション開始"""
        session = StudySession(
            user_id=user_id,
            course_id=course_id,
            session_type=session_type,
        )
        db.add(session)
        await db.flush()
        return session

    async def end_session(
        self,
        db: AsyncSession,
        session_id: uuid.UUID,
        cards_reviewed: int,
        cards_correct: int,
    ) -> StudySession | None:
        """セッション終了"""
        session = await db.get(StudySession, session_id)
        if session is None:
            return None

        session.ended_at = datetime.now(timezone.utc)
        session.cards_reviewed = cards_reviewed
        session.cards_correct = cards_correct
        if session.started_at:
            delta = session.ended_at - session.started_at
            session.duration_seconds = int(delta.total_seconds())
        return session

    async def get_recent_sessions(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 10,
    ) -> list[StudySession]:
        """直近セッション一覧"""
        stmt = (
            select(StudySession)
            .where(StudySession.user_id == user_id)
            .order_by(StudySession.started_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_streak_days(self, db: AsyncSession, user_id: uuid.UUID) -> int:
        """連続学習日数を計算"""
        stmt = (
            select(func.date(StudySession.started_at))
            .where(StudySession.user_id == user_id)
            .distinct()
            .order_by(func.date(StudySession.started_at).desc())
        )
        result = await db.execute(stmt)
        dates = [row[0] for row in result.fetchall()]

        if not dates:
            return 0

        streak = 1
        for i in range(1, len(dates)):
            diff = dates[i - 1] - dates[i]
            if diff.days == 1:
                streak += 1
            else:
                break
        return streak

    async def get_today_stats(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> dict:
        """今日の学習統計"""
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        stmt = (
            select(
                func.sum(StudySession.cards_reviewed),
                func.sum(StudySession.cards_correct),
                func.sum(StudySession.duration_seconds),
                func.count(StudySession.id),
            )
            .where(StudySession.user_id == user_id)
            .where(StudySession.started_at >= today_start)
        )
        result = await db.execute(stmt)
        row = result.one()

        return {
            "cards_reviewed": row[0] or 0,
            "cards_correct": row[1] or 0,
            "duration_seconds": row[2] or 0,
            "session_count": row[3] or 0,
        }


class MasteryService:
    """トピック習熟度管理"""

    async def update_mastery(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        topic_id: uuid.UUID,
        is_correct: bool,
        response_ms: int = 0,
    ) -> UserTopicMastery:
        """レビュー結果を反映して習熟度更新"""
        stmt = select(UserTopicMastery).where(
            UserTopicMastery.user_id == user_id,
            UserTopicMastery.topic_id == topic_id,
        )
        result = await db.execute(stmt)
        mastery = result.scalar_one_or_none()

        if mastery is None:
            mastery = UserTopicMastery(
                user_id=user_id,
                topic_id=topic_id,
            )
            db.add(mastery)

        mastery.total_reviews += 1
        if is_correct:
            mastery.correct_reviews += 1

        # 指数移動平均で習熟度更新 (alpha=0.3)
        alpha = 0.3
        new_score = 1.0 if is_correct else 0.0
        mastery.mastery_score = alpha * new_score + (1 - alpha) * float(mastery.mastery_score)

        # 回答時間の移動平均
        if response_ms > 0:
            mastery.avg_response_ms = int(
                alpha * response_ms + (1 - alpha) * mastery.avg_response_ms
            )

        return mastery

    async def get_course_mastery(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
    ) -> list[dict]:
        """コース内全トピックの習熟度"""
        stmt = (
            select(Topic, UserTopicMastery)
            .outerjoin(
                UserTopicMastery,
                (UserTopicMastery.topic_id == Topic.id)
                & (UserTopicMastery.user_id == user_id),
            )
            .where(Topic.course_id == course_id)
            .order_by(Topic.level, Topic.name)
        )
        result = await db.execute(stmt)
        rows = result.all()

        return [
            {
                "topic_id": str(topic.id),
                "topic_name": topic.name,
                "level": topic.level,
                "weight_pct": float(topic.weight_pct),
                "mastery_score": float(mastery.mastery_score) if mastery else 0.0,
                "total_reviews": mastery.total_reviews if mastery else 0,
                "correct_reviews": mastery.correct_reviews if mastery else 0,
            }
            for topic, mastery in rows
        ]


class ScorePredictionService:
    """合格確率予測"""

    async def predict_pass_probability(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
    ) -> dict:
        """合格確率を推定

        簡易モデル: 加重平均習熟度 × トピック重み → 予測スコア
        """
        # コースの全トピック + 習熟度を取得
        stmt = (
            select(Topic, UserTopicMastery)
            .outerjoin(
                UserTopicMastery,
                (UserTopicMastery.topic_id == Topic.id)
                & (UserTopicMastery.user_id == user_id),
            )
            .where(Topic.course_id == course_id)
        )
        result = await db.execute(stmt)
        rows = result.all()

        if not rows:
            return {
                "predicted_score": 0.0,
                "pass_probability": 0.0,
                "weak_topics": [],
                "recommendation": "学習を開始してください",
            }

        # 加重平均スコア計算
        total_weight = sum(float(t.weight_pct) for t, _ in rows)
        if total_weight == 0:
            total_weight = 1.0

        weighted_score = sum(
            float(t.weight_pct) * (float(m.mastery_score) if m else 0.0)
            for t, m in rows
        ) / total_weight

        # コースの合格基準取得
        course = await db.get(Course, course_id)
        from src.plugins.registry import get_plugin

        plugin = get_plugin(course.code) if course else None
        passing_score = plugin.exam_config.passing_score if plugin else 0.75

        # 合格確率 (シグモイド近似)
        import math
        # スコアが合格基準の付近でシグモイドカーブ
        x = (weighted_score - passing_score) * 10
        pass_prob = 1.0 / (1.0 + math.exp(-x))

        # 弱点トピック (習熟度 < 0.5)
        weak_topics = [
            {
                "topic_id": str(t.id),
                "topic_name": t.name,
                "mastery_score": float(m.mastery_score) if m else 0.0,
                "weight_pct": float(t.weight_pct),
                "priority": float(t.weight_pct) * (1.0 - (float(m.mastery_score) if m else 0.0)),
            }
            for t, m in rows
            if (float(m.mastery_score) if m else 0.0) < 0.5
        ]
        weak_topics.sort(key=lambda x: x["priority"], reverse=True)

        # 推奨アクション生成
        if pass_prob >= 0.85:
            recommendation = "合格圏内です。模擬試験で本番慣れしましょう。"
        elif pass_prob >= 0.6:
            recommendation = f"弱点トピック{len(weak_topics)}件に集中して学習を継続してください。"
        elif pass_prob >= 0.3:
            recommendation = "基礎固めが必要です。低難易度カードから復習しましょう。"
        else:
            recommendation = "学習を開始して、まず各トピックの基本概念を押さえましょう。"

        # 予測結果を保存
        prediction = ScorePrediction(
            user_id=user_id,
            course_id=course_id,
            predicted_score=round(weighted_score * 100, 1),
            pass_probability=round(pass_prob, 4),
            weak_topic_count=len(weak_topics),
        )
        db.add(prediction)

        return {
            "predicted_score": round(weighted_score * 100, 1),
            "pass_probability": round(pass_prob * 100, 1),
            "passing_score": passing_score * 100,
            "weak_topics": weak_topics[:5],
            "total_topics": len(rows),
            "studied_topics": sum(1 for _, m in rows if m and m.total_reviews > 0),
            "recommendation": recommendation,
        }

    async def get_study_roi(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
    ) -> dict:
        """学習ROI - あと何時間で合格確率が上がるか推定"""
        # 直近の学習速度を計算
        stmt = (
            select(
                func.sum(StudySession.duration_seconds),
                func.sum(StudySession.cards_reviewed),
            )
            .where(StudySession.user_id == user_id)
            .where(StudySession.course_id == course_id)
        )
        result = await db.execute(stmt)
        row = result.one()

        total_seconds = row[0] or 0
        total_cards = row[1] or 0
        avg_seconds_per_card = total_seconds / total_cards if total_cards > 0 else 120

        # 未学習カード数
        stmt = (
            select(func.count(Card.id))
            .where(Card.course_id == course_id)
        )
        result = await db.execute(stmt)
        total_course_cards = result.scalar() or 0

        stmt = (
            select(func.count(CardReview.id))
            .where(CardReview.user_id == user_id)
            .join(Card, CardReview.card_id == Card.id)
            .where(Card.course_id == course_id)
            .where(CardReview.state >= 2)  # Review state = mastered
        )
        result = await db.execute(stmt)
        mastered_cards = result.scalar() or 0

        remaining_cards = total_course_cards - mastered_cards
        estimated_hours = (remaining_cards * avg_seconds_per_card) / 3600

        return {
            "total_cards": total_course_cards,
            "mastered_cards": mastered_cards,
            "remaining_cards": remaining_cards,
            "avg_seconds_per_card": round(avg_seconds_per_card, 1),
            "estimated_hours_remaining": round(estimated_hours, 1),
            "total_study_hours": round(total_seconds / 3600, 1),
        }


# シングルトン
session_service = SessionService()
mastery_service = MasteryService()
score_prediction_service = ScorePredictionService()
