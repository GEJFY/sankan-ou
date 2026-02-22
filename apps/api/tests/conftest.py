"""Test fixtures"""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from src.config import settings
from src.database import get_db
from src.main import create_app
from src.models.card import Card
from src.models.course import Course, Topic
from src.models.question import Question
from src.models.user import User


# テスト用エンジン: NullPoolでイベントループ間の接続プール問題を回避
_test_engine = create_async_engine(settings.database_url, poolclass=NullPool)
_test_session_factory = async_sessionmaker(_test_engine, class_=AsyncSession, expire_on_commit=False)

# テスト間でユニークなメールを生成するカウンター
_user_counter = 0


async def _override_get_db():
    """テスト用DBセッション（NullPool使用）"""
    async with _test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def _unique_email(prefix: str = "test") -> str:
    """テスト間で衝突しないユニークメールを生成"""
    global _user_counter
    _user_counter += 1
    return f"{prefix}_{_user_counter}_{uuid.uuid4().hex[:6]}@test.com"


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def app():
    """テスト用FastAPIアプリケーション（DB依存をオーバーライド）"""
    application = create_app()
    application.dependency_overrides[get_db] = _override_get_db
    return application


@pytest.fixture
async def client(app):
    """テスト用非同期HTTPクライアント"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def seed_courses():
    """テスト用最小コースデータ作成 (CIA, CISA)"""
    async with _test_session_factory() as session:
        existing = await session.execute(select(Course).where(Course.code == "CIA"))
        if existing.scalar_one_or_none() is None:
            for code, name, color in [
                ("CIA", "Certified Internal Auditor", "#e94560"),
                ("CISA", "Certified Information Systems Auditor", "#0891b2"),
            ]:
                session.add(Course(code=code, name=name, color=color, is_default=True))
            await session.commit()


@pytest.fixture
async def seed_all_courses():
    """テスト用 CIA/CISA/CFE + Topic + Card 一式作成"""
    async with _test_session_factory() as session:
        course_data = [
            ("CIA", "Certified Internal Auditor", "#e94560"),
            ("CISA", "Certified Information Systems Auditor", "#0891b2"),
            ("CFE", "Certified Fraud Examiner", "#7c3aed"),
        ]
        course_ids = {}
        for code, name, color in course_data:
            existing = await session.execute(select(Course).where(Course.code == code))
            course = existing.scalar_one_or_none()
            if course is None:
                course = Course(code=code, name=name, color=color, is_default=True)
                session.add(course)
                await session.flush()
            course_ids[code] = course.id

        # Topic + Card 作成（各コース1つ）
        for code, course_id in course_ids.items():
            existing_topic = await session.execute(
                select(Topic).where(Topic.course_id == course_id, Topic.level == 1)
            )
            topic = existing_topic.scalars().first()
            if topic is None:
                topic = Topic(
                    course_id=course_id,
                    name=f"{code} テストトピック",
                    level=1,
                    weight_pct=100,
                    sort_order=0,
                )
                session.add(topic)
                await session.flush()

            existing_card = await session.execute(
                select(Card).where(Card.topic_id == topic.id)
            )
            if existing_card.scalars().first() is None:
                for i in range(3):
                    session.add(Card(
                        course_id=course_id,
                        topic_id=topic.id,
                        front=f"{code} テスト問題 {i+1}",
                        back=f"{code} テスト回答 {i+1}",
                        difficulty_tier=1,
                    ))
        await session.commit()
    return course_ids


async def register_and_login(client: AsyncClient, email: str | None = None) -> str:
    """ヘルパー: ユーザー登録+ログインしてトークンを返す"""
    email = email or _unique_email()
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "testpass123", "display_name": "Tester"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "testpass123"},
    )
    return login_resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    """Bearerトークンヘッダーを返す"""
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def seed_questions(seed_all_courses):
    """テスト用Question作成"""
    course_ids = seed_all_courses
    question_ids = {}
    async with _test_session_factory() as session:
        for code, course_id in course_ids.items():
            topic_result = await session.execute(
                select(Topic).where(Topic.course_id == course_id, Topic.level == 1)
            )
            topic = topic_result.scalars().first()
            if topic is None:
                continue

            existing = await session.execute(
                select(Question).where(Question.topic_id == topic.id)
            )
            q = existing.scalars().first()
            if q is None:
                q = Question(
                    course_id=course_id,
                    topic_id=topic.id,
                    stem=f"{code} テスト問題: 内部統制とは何か？",
                    choices=[
                        {"text": "正解の選択肢", "is_correct": True, "explanation": "正解です"},
                        {"text": "不正解A", "is_correct": False, "explanation": "不正解"},
                        {"text": "不正解B", "is_correct": False, "explanation": "不正解"},
                        {"text": "不正解C", "is_correct": False, "explanation": "不正解"},
                    ],
                    explanation="内部統制の解説",
                    difficulty=2,
                    source="manual",
                )
                session.add(q)
                await session.flush()
            question_ids[code] = {"question_id": q.id, "topic_id": topic.id}
        await session.commit()
    return question_ids


async def make_admin(client: AsyncClient) -> tuple[str, str]:
    """admin roleユーザーを作成してトークンを返す"""
    email = _unique_email("admin")
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "adminpass123", "display_name": "Admin"},
    )
    # DBで直接roleをadminに変更
    async with _test_session_factory() as session:
        await session.execute(
            update(User).where(User.email == email).values(role="admin")
        )
        await session.commit()
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "adminpass123"},
    )
    token = login_resp.json()["access_token"]
    return token, email
