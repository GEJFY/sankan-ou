"""CFE (Certified Fraud Examiner) プラグイン"""

import json
from pathlib import Path

from src.plugins.base import CoursePlugin, ExamConfig, SynergyDef, TopicDef

# シラバスの単一情報源: apps/api/seed/syllabus/cfe.json
_SYLLABUS_PATH = Path(__file__).resolve().parents[2] / "seed" / "syllabus" / "cfe.json"


def _load_topics(path: Path) -> list[TopicDef]:
    """seed/syllabus/*.json からトピック階層(Section→サブ領域)を読み込みTopicDefに変換"""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    def to_topic_def(node: dict) -> TopicDef:
        return TopicDef(
            name=node["name"],
            weight_pct=node.get("weight_pct", 0.0),
            keywords=node.get("keywords", []),
            children=[to_topic_def(c) for c in node.get("children", [])],
        )

    return [to_topic_def(section) for section in data["topics"]]


class CFEPlugin(CoursePlugin):
    course_code = "CFE"
    course_name = "Certified Fraud Examiner（公認不正検査士）"
    description = "ACFE（公認不正検査士協会）認定の不正検査の国際資格"
    color = "#7c3aed"
    icon = "⚖️"

    # 2026年6月2日改訂 (2024年JTA準拠): 旧4セクション/400問/8時間制から
    # 新3セクション/310問/6.5時間制へ移行。各セクションは個別に予約・受験する
    # (Prometric ProProctorによるオンライン監督受験)。固定8時間拘束ではない。
    exam_config = ExamConfig(
        total_questions=310,
        duration_minutes=390,
        passing_score=0.75,
        sections=[
            {"section": 1, "name": "Fraud Schemes and Financial Crimes（不正スキームと金融犯罪）", "questions": 120, "duration_min": 150},
            {"section": 2, "name": "Fraud Investigations and Legal Issues（不正調査と法的論点）", "questions": 120, "duration_min": 150},
            {"section": 3, "name": "Fraud Prevention and Deterrence（不正の防止と抑止）", "questions": 70, "duration_min": 90},
        ],
        format_notes="ACFE認定。2026年6月2日改訂版（2024年職務分析(JTA)準拠）。"
        "3セクション制・計310問・合計6.5時間相当（120問/150分 + 120問/150分 + 70問/90分）。"
        "MCQ + True/False混合。各セクション75%以上の正答率で合格。"
        "セクションごとに個別予約し、受験資格有効化から60日以内に完了（固定8時間拘束ではない）。"
        "旧版（Investigation/Lawの2セクション制）は本改訂でFraud Investigations and Legal Issuesに統合。",
    )

    def get_syllabus(self) -> list[TopicDef]:
        return _load_topics(_SYLLABUS_PATH)

    def get_synergy_areas(self) -> list[SynergyDef]:
        return [
            SynergyDef(
                area_name="不正リスク管理",
                overlap_pct=88.0,
                related_courses=["CIA"],
                term_mappings={
                    "CIA": "不正リスクの監査評価",
                    "CFE": "不正リスク評価・防止プログラム設計",
                },
            ),
            SynergyDef(
                area_name="内部統制 (COSO)",
                overlap_pct=92.0,
                related_courses=["CIA", "CISA"],
                term_mappings={
                    "CIA": "内部統制の評価と改善勧告",
                    "CISA": "IT統制の設計と運用評価",
                    "CFE": "不正防止のための統制環境評価",
                },
            ),
            SynergyDef(
                area_name="デジタルフォレンジック",
                overlap_pct=72.0,
                related_courses=["CISA"],
                term_mappings={
                    "CISA": "電子証拠のセキュリティと完全性",
                    "CFE": "不正調査のためのデジタルフォレンジック",
                },
            ),
        ]
