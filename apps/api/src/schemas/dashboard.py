"""Dashboard schemas"""

import uuid

from pydantic import BaseModel


class CourseSummary(BaseModel):
    """コース別進捗サマリー"""

    course_id: uuid.UUID
    course_code: str
    course_name: str
    color: str
    total_cards: int
    mastered: int
    due_today: int
    pass_probability: float


class DashboardSummaryResponse(BaseModel):
    """ダッシュボードサマリー"""

    courses: list[CourseSummary]
    total_studied_today: int
    streak_days: int


class WeakTopic(BaseModel):
    """弱点トピック"""

    topic_id: uuid.UUID
    topic_name: str
    course_code: str
    color: str
    mastery_score: float
    total_cards: int
    failed_cards: int


class WeakTopicsResponse(BaseModel):
    """弱点トピックリスト"""

    topics: list[WeakTopic]


class DailyHistory(BaseModel):
    """日別学習履歴"""

    date: str
    cards_reviewed: int
    correct: int
    minutes: int


class HistoryResponse(BaseModel):
    """学習履歴"""

    history: list[DailyHistory]
