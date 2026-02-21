"""CFE (Certified Fraud Examiner) プラグイン"""

from src.plugins.base import CoursePlugin, ExamConfig, SynergyDef, TopicDef


class CFEPlugin(CoursePlugin):
    course_code = "CFE"
    course_name = "Certified Fraud Examiner（公認不正検査士）"
    description = "ACFE（公認不正検査士協会）認定の不正検査の国際資格"
    color = "#7c3aed"
    icon = "⚖️"

    exam_config = ExamConfig(
        total_questions=400,
        duration_minutes=480,
        passing_score=0.75,
        sections=[
            {"section": 1, "name": "財務取引と不正スキーム", "questions": 100, "duration_min": 120, "weight_pct": 25.0},
            {"section": 2, "name": "法律", "questions": 100, "duration_min": 120, "weight_pct": 25.0},
            {"section": 3, "name": "不正調査", "questions": 100, "duration_min": 120, "weight_pct": 25.0},
            {"section": 4, "name": "不正防止と抑止", "questions": 100, "duration_min": 120, "weight_pct": 25.0},
        ],
        format_notes="ACFE認定。4セクション各100問/2時間（計400問/8時間）。"
        "MCQ + True/False混合。各セクション75%正答で合格。"
        "セクション別受験可。不合格時は最大5回まで再受験可能。",
    )

    def get_syllabus(self) -> list[TopicDef]:
        return [
            TopicDef(
                name="Section 1: 財務取引と不正スキーム",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="会計の基礎",
                        weight_pct=5.0,
                        keywords=["財務諸表", "勘定科目", "仕訳"],
                    ),
                    TopicDef(
                        name="不正スキームの類型",
                        weight_pct=10.0,
                        keywords=["資産横領", "汚職", "財務諸表不正"],
                    ),
                    TopicDef(
                        name="財務諸表不正",
                        weight_pct=5.0,
                        keywords=["収益認識不正", "費用・負債の過小計上", "資産の過大計上"],
                    ),
                    TopicDef(
                        name="資産横領スキーム",
                        weight_pct=5.0,
                        keywords=["現金横領", "請求不正", "給与不正", "経費不正"],
                    ),
                ],
            ),
            TopicDef(
                name="Section 2: 法律",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="米国法の基礎",
                        weight_pct=8.0,
                        keywords=["刑法", "民法", "証拠法則"],
                    ),
                    TopicDef(
                        name="不正関連法規",
                        weight_pct=10.0,
                        keywords=["SOX法", "FCPA", "マネーロンダリング防止法"],
                    ),
                    TopicDef(
                        name="裁判手続と証拠",
                        weight_pct=7.0,
                        keywords=["証拠の連鎖", "デジタルフォレンジック", "証人尋問"],
                    ),
                ],
            ),
            TopicDef(
                name="Section 3: 不正調査",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="調査計画と手法",
                        weight_pct=8.0,
                        keywords=["調査計画", "仮説策定", "調査手順"],
                    ),
                    TopicDef(
                        name="インタビュー技法",
                        weight_pct=7.0,
                        keywords=["認知インタビュー", "自白誘導", "非言語コミュニケーション"],
                    ),
                    TopicDef(
                        name="データ分析と報告",
                        weight_pct=5.0,
                        keywords=["ベンフォード法則", "データマイニング", "調査報告書"],
                    ),
                    TopicDef(
                        name="デジタルフォレンジック",
                        weight_pct=5.0,
                        keywords=["電子証拠保全", "メタデータ分析", "復元技術"],
                    ),
                ],
            ),
            TopicDef(
                name="Section 4: 不正防止と抑止",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="不正リスク管理",
                        weight_pct=8.0,
                        keywords=["不正リスク評価", "不正トライアングル", "ダイアモンドモデル"],
                    ),
                    TopicDef(
                        name="内部統制と不正防止",
                        weight_pct=10.0,
                        keywords=["COSO", "職務分離", "モニタリング", "内部通報"],
                    ),
                    TopicDef(
                        name="倫理とコンプライアンス",
                        weight_pct=7.0,
                        keywords=["倫理プログラム", "行動規範", "コンプライアンス体制"],
                    ),
                ],
            ),
        ]

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
