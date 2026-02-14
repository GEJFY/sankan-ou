"""FSRS (Free Spaced Repetition Scheduler) service"""

import uuid
from datetime import datetime, timezone

from fsrs import Card as FSRSCard
from fsrs import Rating, Scheduler, State
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.card import Card, CardReview, ReviewLog


class FSRSService:
    """py-fsrs v6 wrapper for spaced repetition scheduling"""

    def __init__(self, desired_retention: float = 0.9):
        self.scheduler = Scheduler(
            desired_retention=desired_retention,
            enable_fuzzing=True,
        )

    @staticmethod
    def rating_from_int(value: int) -> Rating:
        """Convert integer rating (1-4) to FSRS Rating enum"""
        mapping = {1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy}
        if value not in mapping:
            raise ValueError(f"Invalid rating: {value}. Must be 1-4.")
        return mapping[value]

    def _card_review_to_fsrs_card(self, review: CardReview) -> FSRSCard:
        """DB CardReview → py-fsrs Card object"""
        fsrs_card = FSRSCard()
        # state=0 は新規カード (py-fsrs ではCard()の初期状態)
        if review.state == 0:
            return fsrs_card
        fsrs_card.due = review.due
        fsrs_card.stability = float(review.stability)
        fsrs_card.difficulty = float(review.difficulty)
        fsrs_card.last_review = review.last_review
        fsrs_card.state = State(review.state)
        # py-fsrs v6: reps/lapses は廃止、step を使用
        if review.state in (1, 3):  # Learning or Relearning
            fsrs_card.step = review.reps  # step として再利用
        return fsrs_card

    def review_card(
        self,
        card_review: CardReview,
        rating_int: int,
        response_time_ms: int = 0,
    ) -> tuple[CardReview, ReviewLog]:
        """カードをレビューしてFSRS状態を更新"""
        rating = self.rating_from_int(rating_int)
        now = datetime.now(timezone.utc)

        # 現在の状態を保存
        state_before = card_review.state
        difficulty_before = float(card_review.difficulty)
        stability_before = float(card_review.stability)

        # py-fsrs Card に変換してレビュー
        fsrs_card = self._card_review_to_fsrs_card(card_review)
        updated_card, _review_log = self.scheduler.review_card(fsrs_card, rating)

        # DB CardReview を更新
        card_review.difficulty = updated_card.difficulty
        card_review.stability = updated_card.stability
        card_review.retrievability = self.scheduler.get_card_retrievability(updated_card)
        new_state = updated_card.state.value
        card_review.due = updated_card.due
        card_review.last_review = now
        card_review.reps += 1  # 自前カウント: レビュー回数
        # Relearning (3) に遷移 = lapse
        if new_state == 3 and card_review.state != 3:
            card_review.lapses += 1
        card_review.state = new_state

        # ReviewLog 作成
        review_log = ReviewLog(
            card_review_id=card_review.id,
            rating=rating_int,
            state_before=state_before,
            state_after=updated_card.state.value,
            difficulty_before=difficulty_before,
            difficulty_after=updated_card.difficulty,
            stability_before=stability_before,
            stability_after=updated_card.stability,
            response_time_ms=response_time_ms,
            reviewed_at=now,
        )

        return card_review, review_log

    async def get_due_cards(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        course_id: uuid.UUID | None = None,
        limit: int = 25,
    ) -> list[CardReview]:
        """復習期日到来カードを取得"""
        now = datetime.now(timezone.utc)

        stmt = (
            select(CardReview)
            .where(CardReview.user_id == user_id)
            .where(CardReview.due <= now)
        )
        if course_id:
            stmt = stmt.join(Card, CardReview.card_id == Card.id).where(
                Card.course_id == course_id
            )
        # New cards first, then by due date
        stmt = stmt.order_by(CardReview.state, CardReview.due).limit(limit)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_or_create_review(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        card_id: uuid.UUID,
    ) -> CardReview:
        """ユーザー×カードのCardReviewを取得 or 新規作成"""
        stmt = select(CardReview).where(
            CardReview.user_id == user_id,
            CardReview.card_id == card_id,
        )
        result = await db.execute(stmt)
        card_review = result.scalar_one_or_none()

        if card_review is None:
            now = datetime.now(timezone.utc)
            card_review = CardReview(
                user_id=user_id,
                card_id=card_id,
                difficulty=0,
                stability=0,
                retrievability=1.0,
                state=0,  # New
                due=now,
                reps=0,
                lapses=0,
            )
            db.add(card_review)
            await db.flush()

        return card_review


# Default service instance
fsrs_service = FSRSService()
