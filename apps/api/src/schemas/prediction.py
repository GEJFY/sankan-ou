"""Prediction schemas"""

from pydantic import BaseModel


class WeakTopicPrediction(BaseModel):
    """弱点トピック（予測用）"""

    topic_name: str
    mastery_score: float
    priority: int


class PredictionResponse(BaseModel):
    """コース別合格予測"""

    predicted_score: int
    pass_probability: float
    passing_score: int
    weak_topics: list[WeakTopicPrediction]
    total_topics: int
    studied_topics: int
    recommendation: str


class ROIResponse(BaseModel):
    """学習ROI分析"""

    total_cards: int
    mastered_cards: int
    remaining_cards: int
    estimated_hours_remaining: float
    total_study_hours: float
