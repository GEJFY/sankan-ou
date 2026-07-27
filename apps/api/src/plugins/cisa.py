"""CISA (Certified Information Systems Auditor) プラグイン"""

import json
from pathlib import Path

from src.plugins.base import CoursePlugin, ExamConfig, SynergyDef, TopicDef

# シラバスの単一情報源: apps/api/seed/syllabus/cisa.json
_SYLLABUS_PATH = Path(__file__).resolve().parents[2] / "seed" / "syllabus" / "cisa.json"


def _load_topics(path: Path) -> list[TopicDef]:
    """seed/syllabus/*.json からトピック階層(統合試験→Domain)を読み込みTopicDefに変換"""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    def to_topic_def(node: dict) -> TopicDef:
        return TopicDef(
            name=node["name"],
            weight_pct=node.get("weight_pct", 0.0),
            keywords=node.get("keywords", []),
            children=[to_topic_def(c) for c in node.get("children", [])],
        )

    return [to_topic_def(part) for part in data["topics"]]


class CISAPlugin(CoursePlugin):
    course_code = "CISA"
    course_name = "Certified Information Systems Auditor（公認情報システム監査人）"
    description = "ISACA認定の情報システム監査・コントロールの国際資格"
    color = "#0891b2"
    icon = "🖥️"

    exam_config = ExamConfig(
        total_questions=150,
        duration_minutes=240,
        passing_score=0.60,
        sections=[
            {"domain": 1, "name": "情報システム監査のプロセス", "questions": 32, "weight_pct": 21.0},
            {"domain": 2, "name": "ITガバナンスとマネジメント", "questions": 26, "weight_pct": 17.0},
            {"domain": 3, "name": "情報システムの取得・開発・導入", "questions": 18, "weight_pct": 12.0},
            {"domain": 4, "name": "情報システムの運用とレジリエンス", "questions": 35, "weight_pct": 23.0},
            {"domain": 5, "name": "情報資産の保護", "questions": 41, "weight_pct": 27.0},
        ],
        format_notes="ISACA認定。4択MCQ 150問/4時間。"
        "スケールドスコア450/800（200-800スケール）で合格。正答率換算で概ね60〜65%が目安。"
        "COBIT/ITIL準拠。Domain 4+5で全体の50%を占める重点領域。",
    )

    def get_syllabus(self) -> list[TopicDef]:
        return _load_topics(_SYLLABUS_PATH)

    def get_synergy_areas(self) -> list[SynergyDef]:
        return [
            SynergyDef(
                area_name="ITガバナンスフレームワーク",
                overlap_pct=85.0,
                related_courses=["CIA"],
                term_mappings={
                    "CIA": "ITガバナンスの監査評価",
                    "CISA": "ITガバナンス設計と運用",
                },
            ),
            SynergyDef(
                area_name="監査プロセス・手法",
                overlap_pct=82.0,
                related_courses=["CIA", "CFE"],
                term_mappings={
                    "CIA": "一般的な内部監査プロセス",
                    "CISA": "IS固有の監査プロセス",
                    "CFE": "不正調査の監査的手法",
                },
            ),
            SynergyDef(
                area_name="事業継続計画 (BCP/DRP)",
                overlap_pct=70.0,
                related_courses=["CIA"],
                term_mappings={
                    "CIA": "BCPの監査と評価",
                    "CISA": "IT DRPの設計と運用",
                },
            ),
        ]
