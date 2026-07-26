"""シナジーカード(is_synergy)フラグをカノニカルなシナジーマップに基づいて同期する"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.card import Card
from src.models.course import Course, Topic
from src.plugins.synergy_map import topic_names_in_synergy


async def sync_synergy_flags(db: AsyncSession) -> int:
    """全カードの is_synergy を、カノニカルなシナジー領域定義に基づいて再計算する

    冪等: 何度実行しても同じ結果になる。アプリ起動時にバッジシードと同様に自動実行され、
    シードデータが変わっても is_synergy フラグが常にシナジーマップと整合するようにする。
    戻り値は変更されたカード数。
    """
    courses = (await db.execute(select(Course))).scalars().all()

    updated = 0
    for course in courses:
        synergy_topic_names = topic_names_in_synergy(course.code)
        if not synergy_topic_names:
            synergy_topic_ids: set[object] = set()
        else:
            topic_rows = await db.execute(
                select(Topic.id).where(
                    Topic.course_id == course.id, Topic.name.in_(synergy_topic_names)
                )
            )
            synergy_topic_ids = {row[0] for row in topic_rows.all()}

        cards = (
            (await db.execute(select(Card).where(Card.course_id == course.id)))
            .scalars()
            .all()
        )
        for card in cards:
            should_be_synergy = card.topic_id in synergy_topic_ids
            if card.is_synergy != should_be_synergy:
                card.is_synergy = should_be_synergy
                updated += 1

    await db.flush()
    return updated
