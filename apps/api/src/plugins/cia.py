"""CIA (Certified Internal Auditor) プラグイン"""

import json
from pathlib import Path

from src.plugins.base import CoursePlugin, ExamConfig, SynergyDef, TopicDef

# シラバスの単一情報源: apps/api/seed/syllabus/cia.json
# (DBシード時に読み込まれるファイルと同じものをここでも読み込み、
#  トピック階層の二重管理・乖離を防ぐ)
_SYLLABUS_PATH = Path(__file__).resolve().parents[2] / "seed" / "syllabus" / "cia.json"


def _load_topics(path: Path) -> list[TopicDef]:
    """seed/syllabus/*.json からトピック階層(Part→Domain)を読み込みTopicDefに変換"""
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


class CIAPlugin(CoursePlugin):
    course_code = "CIA"
    course_name = "Certified Internal Auditor（公認内部監査人）"
    description = "IIA（内部監査人協会）認定の内部監査の国際資格"
    color = "#e94560"
    icon = "🔍"

    exam_config = ExamConfig(
        total_questions=325,
        duration_minutes=390,
        passing_score=0.72,
        sections=[
            {"part": 1, "name": "Internal Audit Fundamentals（内部監査の基礎）", "questions": 125, "duration_min": 150},
            {"part": 2, "name": "Internal Audit Engagement（内部監査の実施）", "questions": 100, "duration_min": 120},
            {"part": 3, "name": "Internal Audit Function（内部監査部門の運営）", "questions": 100, "duration_min": 120},
        ],
        format_notes="IIA（内部監査人協会）認定。4択MCQ。3パート各独立受験。"
        "スケールドスコア600/750（250-750スケール）で合格。正答率換算で概ね70〜75%が目安。"
        "2025年5月改訂のGlobal Internal Audit Standards（GIAS）に完全準拠したシラバス。",
    )

    def get_syllabus(self) -> list[TopicDef]:
        return _load_topics(_SYLLABUS_PATH)

    def get_synergy_areas(self) -> list[SynergyDef]:
        return [
            SynergyDef(
                area_name="内部統制フレームワーク (COSO)",
                overlap_pct=92.0,
                related_courses=["CISA", "CFE"],
                term_mappings={
                    "CIA": "内部統制の評価と改善勧告",
                    "CISA": "IT統制の設計と運用評価",
                    "CFE": "不正防止のための統制環境評価",
                },
            ),
            SynergyDef(
                area_name="リスク管理 (ERM)",
                overlap_pct=88.0,
                related_courses=["CISA", "CFE"],
                term_mappings={
                    "CIA": "ERMフレームワーク全体の評価",
                    "CISA": "ITリスク評価とリスク対応",
                    "CFE": "不正リスク評価と対応策",
                },
            ),
            SynergyDef(
                area_name="コーポレートガバナンス",
                overlap_pct=85.0,
                related_courses=["CISA", "CFE"],
                term_mappings={
                    "CIA": "ガバナンスプロセスの評価",
                    "CISA": "ITガバナンスフレームワーク",
                    "CFE": "不正防止ガバナンス体制",
                },
            ),
            SynergyDef(
                area_name="コンプライアンス/法規制",
                overlap_pct=78.0,
                related_courses=["CISA", "CFE"],
                term_mappings={
                    "CIA": "法令遵守の監査",
                    "CISA": "IT法規制（個人情報保護等）",
                    "CFE": "不正関連法規（刑法、会社法等）",
                },
            ),
            SynergyDef(
                area_name="情報セキュリティ",
                overlap_pct=75.0,
                related_courses=["CISA"],
                term_mappings={
                    "CIA": "情報資産保護の監査",
                    "CISA": "情報セキュリティ管理",
                },
            ),
        ]
