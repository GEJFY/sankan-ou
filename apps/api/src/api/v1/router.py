"""API v1 router - 全エンドポイント集約"""

from fastapi import APIRouter

from src.api.v1 import (
    admin, auth, cards, courses, dashboard, enrollments, gamification, health,
    media, mock_exam, questions, sessions, synergy, tutor,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(courses.router)
api_router.include_router(cards.router)
api_router.include_router(dashboard.router)
api_router.include_router(tutor.router)
api_router.include_router(questions.router)
api_router.include_router(synergy.router)
api_router.include_router(sessions.router)
api_router.include_router(mock_exam.router)
api_router.include_router(media.router)
api_router.include_router(gamification.router)
api_router.include_router(enrollments.router)
api_router.include_router(admin.router)
