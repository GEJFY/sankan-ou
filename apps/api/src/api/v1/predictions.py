"""Predictions endpoints — 合格予測・学習ROI分析"""

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from src.deps import CurrentUser, DbSession
from src.models.card import Card, CardReview, ReviewLog
from src.models.course import Course, Topic
from src.schemas.prediction import (
    PredictionResponse,
    ROIResponse,
    WeakTopicPrediction,
)

router = APIRouter(prefix="/predictions", tags=["predictions"])


def _passing_score_pct(exam_config: dict | None) -> int:
    """exam_config からスコア形式の合格ライン(%)を推定"""
    if not exam_config:
        return 70
    raw = exam_config.get("passing_score", "")
    if isinstance(raw, (int, float)):
        return int(raw * 100) if raw <= 1 else int(raw)
    s = str(raw)
    if "75/99" in s:
        return 76  # USCPA scaled
    if "60%" in s or "60/100" in s:
        return 60
    if "120/200" in s:
        return 60
    if "70/100" in s:
        return 70
    if "75%" in s:
        return 75
    return 70


def _recommendation(pass_prob: float, weak_count: int, remaining: int) -> str:
    """学習状況に基づく推奨アクション"""
    if pass_prob >= 0.8:
        return "合格圏内です。弱点トピックの仕上げと模試演習で安定させましょう。"
    if pass_prob >= 0.5:
        if weak_count > 0:
            return f"合格に近づいています。弱点{weak_count}トピックの集中復習が効果的です。"
        return "順調です。未学習カードの消化を優先しましょう。"
    if remaining > 0:
        return f"残り{remaining}枚のカードがあります。まず基礎トピックから取り組みましょう。"
    return "カードを追加して学習を開始しましょう。"


@router.get("/{course_id}", response_model=PredictionResponse)
async def get_prediction(
    course_id: str, db: DbSession, current_user: CurrentUser
) -> PredictionResponse:
    """コース別合格予測"""
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 全カード数
    total_cards = (
        await db.execute(
            select(func.count(Card.id)).where(Card.course_id == course.id)
        )
    ).scalar() or 0

    # トピック別の習熟度を計算
    topic_stats = (
        await db.execute(
            select(
                Topic.id,
                Topic.name,
                func.count(CardReview.id).label("total"),
                func.coalesce(func.sum(CardReview.lapses), 0).label("total_lapses"),
                func.coalesce(func.avg(CardReview.retrievability), 0).label("avg_retrievability"),
            )
            .select_from(Topic)
            .outerjoin(Card, Card.topic_id == Topic.id)
            .outerjoin(
                CardReview,
                (CardReview.card_id == Card.id) & (CardReview.user_id == current_user.id),
            )
            .where(Topic.course_id == course.id)
            .where(Topic.level == 1)
            .group_by(Topic.id, Topic.name)
        )
    ).all()

    # 全level==1トピック数
    total_topics = len(topic_stats)
    studied_topics = sum(1 for t in topic_stats if t.total and t.total > 0)

    # 弱点トピック計算
    weak_topics: list[WeakTopicPrediction] = []
    mastery_sum = 0.0
    for row in topic_stats:
        card_count = row.total or 0
        lapses = row.total_lapses or 0
        if card_count > 0:
            mastery = max(0.0, 1.0 - (lapses / (card_count * 3)))
        else:
            mastery = 0.0
        mastery_sum += mastery
        weak_topics.append(
            WeakTopicPrediction(
                topic_name=row.name,
                mastery_score=round(mastery, 4),
                priority=0,
            )
        )

    # mastery_score昇順でソートし、priority付与
    weak_topics.sort(key=lambda x: x.mastery_score)
    for i, wt in enumerate(weak_topics):
        wt.priority = i + 1

    # mastery_score < 0.7 のトピックのみ弱点として返す
    weak_only = [wt for wt in weak_topics if wt.mastery_score < 0.7]

    # 合格確率: 習熟度の加重平均
    avg_mastery = (mastery_sum / total_topics) if total_topics > 0 else 0.0

    # mastered cards (state=2, stability>21)
    mastered = (
        await db.execute(
            select(func.count(CardReview.id))
            .join(Card, CardReview.card_id == Card.id)
            .where(Card.course_id == course.id)
            .where(CardReview.user_id == current_user.id)
            .where(CardReview.state == 2)
            .where(CardReview.stability > 21)
        )
    ).scalar() or 0

    coverage = (mastered / total_cards) if total_cards > 0 else 0.0
    # 合格確率 = mastery(70%) + coverage(30%)
    pass_prob = min(1.0, avg_mastery * 0.7 + coverage * 0.3)

    passing_pct = _passing_score_pct(course.exam_config)
    predicted_score = int(pass_prob * 100)

    return PredictionResponse(
        predicted_score=predicted_score,
        pass_probability=round(pass_prob * 100, 1),
        passing_score=passing_pct,
        weak_topics=weak_only[:5],
        total_topics=total_topics,
        studied_topics=studied_topics,
        recommendation=_recommendation(pass_prob, len(weak_only), total_cards - mastered),
    )


@router.get("/{course_id}/roi", response_model=ROIResponse)
async def get_roi(
    course_id: str, db: DbSession, current_user: CurrentUser
) -> ROIResponse:
    """学習ROI分析"""
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 全カード数
    total_cards = (
        await db.execute(
            select(func.count(Card.id)).where(Card.course_id == course.id)
        )
    ).scalar() or 0

    # Mastered (state=2, stability>21)
    mastered = (
        await db.execute(
            select(func.count(CardReview.id))
            .join(Card, CardReview.card_id == Card.id)
            .where(Card.course_id == course.id)
            .where(CardReview.user_id == current_user.id)
            .where(CardReview.state == 2)
            .where(CardReview.stability > 21)
        )
    ).scalar() or 0

    remaining = total_cards - mastered

    # 学習済み時間: ReviewLogの総数 × 平均30秒/カード
    total_reviews = (
        await db.execute(
            select(func.count(ReviewLog.id))
            .join(CardReview, ReviewLog.card_review_id == CardReview.id)
            .join(Card, CardReview.card_id == Card.id)
            .where(Card.course_id == course.id)
            .where(CardReview.user_id == current_user.id)
        )
    ).scalar() or 0

    # 1レビュー ≈ 30秒として概算
    total_study_hours = round(total_reviews * 0.5 / 60, 1)

    # 残りカードの推定学習時間: 新規カード1枚 ≈ 平均5レビュー × 30秒
    estimated_hours_remaining = round(remaining * 5 * 0.5 / 60, 1)

    return ROIResponse(
        total_cards=total_cards,
        mastered_cards=mastered,
        remaining_cards=remaining,
        estimated_hours_remaining=estimated_hours_remaining,
        total_study_hours=total_study_hours,
    )
