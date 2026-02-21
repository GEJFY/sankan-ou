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
    "USCPA": {
        "AUD-A. 監査の倫理・独立性・品質管理": [
            {
                "front": "AICPA倫理規程における独立性の2つの側面を説明せよ。",
                "back": "1. Independence in fact（精神的独立性）: 監査人が実際に偏りなく判断できる精神状態\n2. Independence in appearance（外観的独立性）: 合理的な第三者から見て独立と認識される状態\n両方を満たす必要がある。",
            },
        ],
        "AUD-B. 監査業務の計画と実施": [
            {
                "front": "監査リスクモデル（Audit Risk Model）の公式と各要素を説明せよ。",
                "back": "AR = IR × CR × DR\nAR（Audit Risk）: 監査リスク\nIR（Inherent Risk）: 固有リスク\nCR（Control Risk）: 統制リスク\nDR（Detection Risk）: 発見リスク\n監査人はDRを調整して許容AR水準を達成する。",
            },
        ],
        "FAR-A. 財務会計の基礎": [
            {
                "front": "ASC 606（収益認識基準）の5ステップモデルを説明せよ。",
                "back": "1. 契約の識別\n2. 履行義務の識別\n3. 取引価格の算定\n4. 取引価格の履行義務への配分\n5. 履行義務充足時の収益認識\nIFRS 15とほぼ同一の基準。",
            },
        ],
        "REG-A. 個人所得税": [
            {
                "front": "米国所得税における Above-the-line deductions と Below-the-line deductions の違いは？",
                "back": "Above-the-line: AGI算出前に控除。例: IRA拠出金、学生ローン利息。全納税者が利用可。\nBelow-the-line: AGI算出後に控除。Standard deduction か Itemized deduction を選択。",
            },
        ],
    },
    "BOKI1": {
        "BOKI-B. 連結会計": [
            {
                "front": "連結修正仕訳で「投資と資本の相殺消去」の基本仕訳を示せ。",
                "back": "（借方）資本金 ×× / （貸方）子会社株式 ××\n（借方）利益剰余金 ××\n（借方）のれん ×× ← 差額\n（貸方）非支配株主持分 ×× ← 子会社純資産×非支配持分比率",
            },
        ],
        "ACCT-B. 税効果会計": [
            {
                "front": "繰延税金資産の回収可能性の判断基準を5つの分類で説明せよ。",
                "back": "分類1: 過去3年以上連続で課税所得がプラス → 全額回収可能\n分類2: 安定的に課税所得を計上 → スケジューリング可能な範囲\n分類3: 業績不安定 → 合理的な見積可能期間のみ\n分類4: 重要な税務上の欠損金 → 翌期の見積範囲のみ\n分類5: 過去3年以上連続で欠損金 → 原則回収不能",
            },
        ],
        "COST-B. 標準原価計算": [
            {
                "front": "標準原価計算の差異分析で、直接材料費差異の2区分を説明せよ。",
                "back": "価格差異 = (実際単価 - 標準単価) × 実際消費量\n数量差異 = (実際消費量 - 標準消費量) × 標準単価\n価格差異は購買部門、数量差異は製造部門の責任として管理。",
            },
        ],
        "MGMT-A. CVP分析・損益分岐点": [
            {
                "front": "損益分岐点売上高の算出式を示せ。",
                "back": "損益分岐点売上高 = 固定費 ÷ 貢献利益率\n貢献利益率 = 1 - 変動費率\n損益分岐点数量 = 固定費 ÷ 単位あたり貢献利益\n安全余裕率 = (実際売上高 - BEP売上高) ÷ 実際売上高 × 100",
            },
        ],
    },
    "FP": {
        "FP-A. ライフプランニングと資金計画": [
            {
                "front": "6つの係数（年金終価係数、減債基金係数等）を用途別に整理せよ。",
                "back": "1. 終価係数: 現在の元本が将来いくらになるか\n2. 現価係数: 将来の金額の現在価値\n3. 年金終価係数: 毎年の積立が将来いくらになるか\n4. 減債基金係数: 将来の目標額に必要な毎年の積立額\n5. 年金現価係数: 毎年一定額受取るための必要元本\n6. 資本回収係数: 元本から毎年いくら受取れるか",
            },
        ],
        "FP-D. タックスプランニング": [
            {
                "front": "所得税の10種類の所得を列挙せよ。",
                "back": "1. 利子所得 2. 配当所得 3. 不動産所得 4. 事業所得\n5. 給与所得 6. 退職所得 7. 山林所得 8. 譲渡所得\n9. 一時所得 10. 雑所得\n損益通算可能: 不動産・事業・山林・譲渡（ふじさんじょう）",
            },
        ],
        "FP-F. 相続・事業承継": [
            {
                "front": "相続税の基礎控除額の計算式を示せ。",
                "back": "基礎控除額 = 3,000万円 + 600万円 × 法定相続人の数\n例: 配偶者と子2人 = 3,000万円 + 600万円 × 3人 = 4,800万円\n課税遺産総額がこの額以下なら相続税は非課税。",
            },
        ],
    },
    "RISS": {
        "RISS-A. 暗号技術・認証技術": [
            {
                "front": "共通鍵暗号と公開鍵暗号の特徴を比較せよ。",
                "back": "共通鍵暗号（AES等）: 同一鍵で暗号化/復号。高速。鍵配送問題あり。n人通信にn(n-1)/2個の鍵。\n公開鍵暗号（RSA等）: 異なる鍵。低速。鍵配送問題なし。n人通信に2n個の鍵。\nハイブリッド暗号: 公開鍵で共通鍵を配送し共通鍵でデータ暗号化（TLS等）。",
            },
        ],
        "RISS-C. 攻撃手法と対策": [
            {
                "front": "SQLインジェクションの原理と対策を説明せよ。",
                "back": "原理: ユーザー入力をSQL文に直接埋め込み意図しないSQLが実行される。\n対策:\n1. プリペアドステートメント（パラメータ化クエリ）\n2. 入力値のエスケープ処理\n3. WAFの導入\n4. 最小権限の原則（DB接続ユーザー）",
            },
        ],
        "RISS-D. セキュリティマネジメント(ISMS)": [
            {
                "front": "ISO 27001のPDCAサイクルをISMS構築に適用する方法を説明せよ。",
                "back": "Plan: ISMSの確立（適用範囲定義、リスクアセスメント、管理策選択）\nDo: ISMSの導入・運用（管理策の実施、教育・訓練）\nCheck: ISMSの監視・レビュー（内部監査、マネジメントレビュー）\nAct: ISMSの維持・改善（是正処置、予防処置）\nAnnex Aに93の管理策（2022年版）。",
            },
        ],
        "RISS-E. インシデント対応・フォレンジック": [
            {
                "front": "CSIRTの主な機能と役割を説明せよ。",
                "back": "CSIRT（Computer Security Incident Response Team）:\n1. インシデントの検知・受付\n2. トリアージ（優先度判定）\n3. インシデント対応・封じ込め\n4. 原因分析・フォレンジック\n5. 復旧支援\n6. 再発防止策の策定\n7. 外部組織（JPCERT/CC等）との情報共有",
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
