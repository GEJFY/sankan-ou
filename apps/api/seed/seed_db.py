"""DBシードスクリプト - コース/トピック/デモユーザー/サンプルカード投入"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import async_session_factory, engine
from src.models import Base, Card, CardReview, Course, Topic, User, UserEnrollment

SYLLABUS_DIR = Path(__file__).parent / "syllabus"

# デモユーザー (MVP用)
DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

# サンプルカード (各トピック2-3枚のハードコード版、LLM生成は別途)
SAMPLE_CARDS = {
    "CIA": {
        "A. 内部監査の目的と権限": [
            {
                "front": "IIAの内部監査の定義において、内部監査の目的は何か？",
                "back": "組織体の運営に価値を付加し改善するために、独立にして客観的なアシュアランスおよびコンサルティング活動を提供すること。リスク・マネジメント、コントロールおよびガバナンスの各プロセスの有効性の評価・改善を通じて、組織体の目標達成に貢献する。",
            },
            {
                "front": "内部監査の「独立性」と「客観性」の違いを説明せよ。",
                "back": "独立性: 組織上の位置づけ（CAEが経営者から独立した報告ライン。取締役会への機能的報告）。\n客観性: 個人の心的態度。偏りなく公正に判断できる精神的態度。利益相反の回避が重要。",
            },
        ],
        "B. 倫理と職業専門性": [
            {
                "front": "IIA倫理綱要の4つの原則は何か？",
                "back": "1. 誠実性（Integrity）\n2. 客観性（Objectivity）\n3. 秘密の保持（Confidentiality）\n4. 専門的能力（Competency）",
            },
        ],
        "C. ガバナンスとリスクマネジメント": [
            {
                "front": "COSO ERMフレームワークの5つの構成要素は何か？",
                "back": "1. ガバナンスと文化\n2. 戦略と目標設定\n3. パフォーマンス\n4. レビューと修正\n5. 情報・伝達・報告",
            },
        ],
        "D. 不正リスク": [
            {
                "front": "不正のトライアングル（Fraud Triangle）の3要素は何か？",
                "back": "1. 動機・プレッシャー（Incentive/Pressure）\n2. 機会（Opportunity）\n3. 正当化（Rationalization）\nドナルド・R・クレッシーが提唱した理論。",
            },
        ],
    },
    "CISA": {
        "D1. 情報システム監査プロセス": [
            {
                "front": "IS監査計画で考慮すべきリスクベースアプローチとは何か？",
                "back": "限られた監査資源を最もリスクの高い領域に配分する手法。ビジネスリスク、IT環境の複雑さ、過去の監査結果、規制要件、経営層の懸念事項等を考慮してリスク評価を行い、監査対象と優先度を決定する。",
            },
        ],
        "D2. ITのガバナンスとマネジメント": [
            {
                "front": "COBIT 2019の設計要因（Design Factor）を3つ挙げよ。",
                "back": "1. 企業戦略\n2. 企業規模\n3. IT関連リスクプロファイル\n他に: 脅威ランドスケープ、コンプライアンス要件、IT部門の役割、調達モデル等がある。",
            },
        ],
        "D5. 情報資産の保護": [
            {
                "front": "多層防御（Defense in Depth）の概念を説明せよ。",
                "back": "複数のセキュリティ層を配置し、一つの防御が突破されても他の層で攻撃を食い止める戦略。物理的セキュリティ→ネットワーク→ホスト→アプリケーション→データの各層で対策を講じる。",
            },
        ],
    },
    "CFE": {
        "S1. 財務取引と不正スキーム": [
            {
                "front": "横領（Embezzlement）とラーセニー（Larceny）の違いは？",
                "back": "横領: 正当に預かった他人の財産を不正に自己のものにする行為。受託関係の濫用。\nラーセニー: 他人の財産を同意なく不法に取得する行為。最初から占有権がない。\n横領は信頼関係の裏切りである点で罪が重いとされる。",
            },
        ],
        "S2. 法律（Law）": [
            {
                "front": "米国SOX法（Sarbanes-Oxley Act）のSection 302とSection 404の違いは？",
                "back": "Section 302: CEOとCFOが財務報告の正確性を個人的に証明する義務。\nSection 404: 内部統制の有効性について経営者評価と外部監査人による検証を要求。\nどちらもエンロン事件等を受けて2002年に制定。",
            },
        ],
        "S4. 不正防止と抑止": [
            {
                "front": "不正通報制度（Whistleblower Program）が効果的であるための要件を3つ挙げよ。",
                "back": "1. 匿名性の保証（通報者の身元保護）\n2. 報復からの保護（法的・組織的保護策）\n3. 独立した受付窓口（外部委託のホットライン等）\n追加: 経営層のコミットメント、通報後のフォローアップ、定期的な教育・啓発。",
            },
        ],
    },
}


async def seed_courses_and_topics(db: AsyncSession) -> dict[str, uuid.UUID]:
    """コースとトピックをシード"""
    course_ids: dict[str, uuid.UUID] = {}
    topic_map: dict[str, uuid.UUID] = {}  # "CIA::A. 内部監査の目的と権限" -> UUID

    for syllabus_file in sorted(SYLLABUS_DIR.glob("*.json")):
        with open(syllabus_file) as f:
            data = json.load(f)

        # コース作成
        existing = await db.execute(
            select(Course).where(Course.code == data["code"])
        )
        course = existing.scalar_one_or_none()
        if course is None:
            course = Course(
                code=data["code"],
                name=data["name"],
                color=data["color"],
                exam_config=data.get("exam_config"),
            )
            db.add(course)
            await db.flush()

        course_ids[data["code"]] = course.id

        # トピック作成
        sort_order = 0
        for part in data["topics"]:
            parent_topic = Topic(
                course_id=course.id,
                name=part["name"],
                weight_pct=part.get("weight_pct", 0),
                level=part.get("level", 0),
                sort_order=sort_order,
            )
            db.add(parent_topic)
            await db.flush()
            sort_order += 1

            for child in part.get("children", []):
                child_topic = Topic(
                    course_id=course.id,
                    parent_id=parent_topic.id,
                    name=child["name"],
                    weight_pct=child.get("weight_pct", 0),
                    level=child.get("level", 1),
                    sort_order=sort_order,
                )
                db.add(child_topic)
                await db.flush()
                topic_map[f"{data['code']}::{child['name']}"] = child_topic.id
                sort_order += 1

    return course_ids, topic_map


async def seed_demo_user(db: AsyncSession, course_ids: dict[str, uuid.UUID]) -> None:
    """デモユーザー作成"""
    existing = await db.execute(select(User).where(User.id == DEMO_USER_ID))
    if existing.scalar_one_or_none() is not None:
        return

    user = User(
        id=DEMO_USER_ID,
        email="demo@sankanou.dev",
        hashed_password="$2b$12$demo_hashed_password_placeholder",
        display_name="Demo User",
        role="learner",
    )
    db.add(user)
    await db.flush()

    # 全コースに登録
    for course_id in course_ids.values():
        enrollment = UserEnrollment(
            user_id=DEMO_USER_ID,
            course_id=course_id,
            desired_retention=0.9,
        )
        db.add(enrollment)


async def seed_sample_cards(
    db: AsyncSession,
    course_ids: dict[str, uuid.UUID],
    topic_map: dict[str, uuid.UUID],
) -> None:
    """サンプルカード投入"""
    now = datetime.now(timezone.utc)

    for course_code, topics in SAMPLE_CARDS.items():
        course_id = course_ids.get(course_code)
        if not course_id:
            continue

        for topic_name, cards in topics.items():
            topic_key = f"{course_code}::{topic_name}"
            topic_id = topic_map.get(topic_key)
            if not topic_id:
                continue

            for card_data in cards:
                card = Card(
                    course_id=course_id,
                    topic_id=topic_id,
                    front=card_data["front"],
                    back=card_data["back"],
                    difficulty_tier=1,
                )
                db.add(card)
                await db.flush()

                # CardReview作成 (New状態、即座にdue)
                card_review = CardReview(
                    user_id=DEMO_USER_ID,
                    card_id=card.id,
                    difficulty=0,
                    stability=0,
                    retrievability=1.0,
                    state=0,
                    due=now,
                    reps=0,
                    lapses=0,
                )
                db.add(card_review)


async def main() -> None:
    """メインシード処理"""
    # テーブル作成 (開発用 - 本番ではAlembic使用)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        try:
            course_ids, topic_map = await seed_courses_and_topics(db)
            await seed_demo_user(db, course_ids)
            await seed_sample_cards(db, course_ids, topic_map)
            await db.commit()
            print(f"Seed complete: {len(course_ids)} courses, {len(topic_map)} topics")
        except Exception as e:
            await db.rollback()
            print(f"Seed failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
