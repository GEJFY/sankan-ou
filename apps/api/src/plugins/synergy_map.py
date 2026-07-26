"""資格横断シナジー領域のカノニカル定義 (単一の情報源)

以前は各 CoursePlugin.get_synergy_areas() が「自分視点」でシナジー領域を個別定義しており、
registry.get_all_synergy_areas() が area_name の完全一致だけで重複排除していたため、
- 表記ゆれ(例: "内部統制フレームワーク (COSO)" vs "内部統制 (COSO)")で同一概念が別領域として重複表示される
- 後から登録されたプラグインの定義（USCPAなど）が同名の別プラグイン定義に上書きされ、
  本来含まれるべき資格がシナジー領域の related_courses から欠落する
という2つの不具合があった。

この module は「1つの概念 = 1つのレコード」を保証するカノニカルなシナジーマップを提供し、
各資格の実シラバス(apps/api/seed/syllabus/*.json, Topic.level==1相当)のトピック名と
直接紐付ける。これにより:
- /synergy エンドポイントでの「カリキュラム横並び分析」が可能になる
- シードデータのカードに is_synergy フラグを正しく設定できる (src/services/synergy_service.py)
- あるコースでそのトピックを習得済みなら、重複領域を持つ他コースで
  「学習時間を節約できる」ことをユーザーに提示できる

CIA(2025年GIAS改訂)・CFE(2026年6月改訂の3セクション制)のトピック名は
apps/api/seed/syllabus/{cia,cfe}.json の実際のトピック名と完全一致させること。
"""

from dataclasses import dataclass, field


@dataclass
class CanonicalSynergyArea:
    """資格横断で重複する学習領域 (単一の情報源)"""

    area_name: str
    overlap_pct: float
    courses: list[str]
    term_mappings: dict[str, str] = field(default_factory=dict)
    # course_code -> その資格の実シラバス上で該当するトピック名 (Topic.name と完全一致)
    topic_names: dict[str, str] = field(default_factory=dict)
    description: str = ""


CANONICAL_SYNERGY_AREAS: list[CanonicalSynergyArea] = [
    CanonicalSynergyArea(
        area_name="内部統制フレームワーク (COSO)",
        overlap_pct=90.0,
        courses=["CIA", "CISA", "CFE", "USCPA"],
        term_mappings={
            "CIA": "ガバナンス・リスク・コントロールの評価",
            "CISA": "IT統制の設計と運用評価",
            "CFE": "内部統制による不正防止",
            "USCPA": "COSO Internal Control - Integrated Framework",
        },
        topic_names={
            "CIA": "C. Governance, Risk Management, and Control（ガバナンス・リスク・コントロール）",
            "CISA": "D2. ITのガバナンスとマネジメント",
            "CFE": "B. 内部統制と不正防止（Internal Controls & Prevention）",
            "USCPA": "AUD-C. 内部統制の評価",
        },
        description="COSO内部統制フレームワークは4資格すべての出題範囲で共通の土台となる。"
        "1資格で深く学べば残りは「同じ概念の別の切り口」として短時間で確認できる。",
    ),
    CanonicalSynergyArea(
        area_name="リスク管理 (ERM)",
        overlap_pct=85.0,
        courses=["CIA", "CISA", "CFE"],
        term_mappings={
            "CIA": "ERMフレームワーク全体の評価",
            "CISA": "ITリスク評価とリスク対応",
            "CFE": "不正リスク評価と対応策",
        },
        topic_names={
            "CIA": "C. Governance, Risk Management, and Control（ガバナンス・リスク・コントロール）",
            "CISA": "D2. ITのガバナンスとマネジメント",
            "CFE": "A. 不正リスク管理（Fraud Risk Management）",
        },
    ),
    CanonicalSynergyArea(
        area_name="コーポレートガバナンス",
        overlap_pct=82.0,
        courses=["CIA", "CISA"],
        term_mappings={
            "CIA": "ガバナンスプロセスの評価",
            "CISA": "ITガバナンスフレームワーク",
        },
        topic_names={
            "CIA": "C. Governance, Risk Management, and Control（ガバナンス・リスク・コントロール）",
            "CISA": "D2. ITのガバナンスとマネジメント",
        },
    ),
    CanonicalSynergyArea(
        area_name="監査計画・業務計画 (リスクベースアプローチ)",
        overlap_pct=88.0,
        courses=["CIA", "CISA", "USCPA"],
        term_mappings={
            "CIA": "監査業務の計画（Engagement Planning）",
            "CISA": "IS固有の監査プロセス",
            "USCPA": "Audit Risk Model (AR = IR × CR × DR)",
        },
        topic_names={
            "CIA": "A. Engagement Planning（業務の計画）",
            "CISA": "D1. 情報システム監査プロセス",
            "USCPA": "AUD-B. 監査業務の計画と実施",
        },
    ),
    CanonicalSynergyArea(
        area_name="不正リスク評価・不正トライアングル",
        overlap_pct=88.0,
        courses=["CIA", "CFE", "USCPA"],
        term_mappings={
            "CIA": "不正リスクの監査評価",
            "CFE": "不正リスク評価・防止プログラム設計",
            "USCPA": "SAS 99 不正リスク要因の考慮",
        },
        topic_names={
            "CIA": "D. Fraud Risks（不正リスク）",
            "CFE": "A. 不正リスク管理（Fraud Risk Management）",
            "USCPA": "AUD-B. 監査業務の計画と実施",
        },
    ),
    CanonicalSynergyArea(
        area_name="職業倫理・コンプライアンス",
        overlap_pct=75.0,
        courses=["CIA", "CFE", "USCPA"],
        term_mappings={
            "CIA": "職業倫理と行動規範",
            "CFE": "倫理・コンプライアンスプログラムの構築",
            "USCPA": "AICPA倫理規程・独立性",
        },
        topic_names={
            "CIA": "B. Ethics and Professionalism（倫理と職業専門性）",
            "CFE": "C. 倫理・コンプライアンスプログラム（Ethics & Compliance Programs）",
            "USCPA": "AUD-A. 監査の倫理・独立性・品質管理",
        },
    ),
    CanonicalSynergyArea(
        area_name="法規制・法的枠組み",
        overlap_pct=68.0,
        courses=["CISA", "CFE"],
        term_mappings={
            "CISA": "IT法規制（個人情報保護等）",
            "CFE": "不正関連の法的枠組みと訴訟手続",
        },
        topic_names={
            "CISA": "D5. 情報資産の保護",
            "CFE": "D. 法的枠組みと訴訟手続（Legal Framework & Litigation）",
        },
    ),
    CanonicalSynergyArea(
        area_name="情報セキュリティ・IT統制",
        overlap_pct=78.0,
        courses=["CIA", "CISA"],
        term_mappings={
            "CIA": "情報資産保護に関するリスク評価",
            "CISA": "情報セキュリティ管理",
        },
        topic_names={
            "CIA": "C. Governance, Risk Management, and Control（ガバナンス・リスク・コントロール）",
            "CISA": "D5. 情報資産の保護",
        },
        description="2025年改訂でCIAのIT関連論点はPart1「ガバナンス・リスク・コントロール」に統合された。"
        "CISAのD5と完全に同一ではないが、リスク評価の観点は共通する。",
    ),
    CanonicalSynergyArea(
        area_name="事業継続・レジリエンス",
        overlap_pct=65.0,
        courses=["CIA", "CISA"],
        term_mappings={
            "CIA": "業務中断リスクの評価",
            "CISA": "IT事業継続・災害復旧計画",
        },
        topic_names={
            "CIA": "C. Governance, Risk Management, and Control（ガバナンス・リスク・コントロール）",
            "CISA": "D4. IS運用とビジネスレジリエンス",
        },
    ),
    CanonicalSynergyArea(
        area_name="デジタルフォレンジック・電子証拠",
        overlap_pct=72.0,
        courses=["CISA", "CFE"],
        term_mappings={
            "CISA": "電子証拠のセキュリティと完全性",
            "CFE": "不正調査のためのデジタルフォレンジック",
        },
        topic_names={
            "CISA": "D5. 情報資産の保護",
            "CFE": "C. デジタルフォレンジックとデータ分析（Digital Forensics & Data Analysis）",
        },
    ),
    CanonicalSynergyArea(
        area_name="財務諸表分析・財務諸表不正",
        overlap_pct=70.0,
        courses=["CFE", "USCPA"],
        term_mappings={
            "CFE": "財務諸表不正の兆候分析",
            "USCPA": "財務諸表の作成・表示",
        },
        topic_names={
            "CFE": "C. 財務諸表不正（Financial Statement Fraud）",
            "USCPA": "FAR-A. 財務会計の基礎",
        },
    ),
]


def get_canonical_synergy_areas() -> list[CanonicalSynergyArea]:
    """重複率の高い順にソートして返す"""
    return sorted(CANONICAL_SYNERGY_AREAS, key=lambda a: a.overlap_pct, reverse=True)


def topic_names_in_synergy(course_code: str) -> set[str]:
    """指定コースにおいて、いずれかのシナジー領域に属するトピック名の集合を返す

    Card.is_synergy の同期 (src/services/synergy_service.py) や
    シナジー学習カードの抽出に使う。
    """
    names: set[str] = set()
    for area in CANONICAL_SYNERGY_AREAS:
        name = area.topic_names.get(course_code.upper())
        if name:
            names.add(name)
    return names


def areas_for_course(course_code: str) -> list[CanonicalSynergyArea]:
    """指定コースが関与するシナジー領域のみ返す"""
    code = course_code.upper()
    return [a for a in get_canonical_synergy_areas() if code in a.courses]
