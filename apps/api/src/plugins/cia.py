"""CIA (Certified Internal Auditor) プラグイン"""

from src.plugins.base import CoursePlugin, ExamConfig, SynergyDef, TopicDef


class CIAPlugin(CoursePlugin):
    course_code = "CIA"
    course_name = "Certified Internal Auditor（公認内部監査人）"
    description = "IIA（内部監査人協会）認定の内部監査の国際資格"
    color = "#e94560"
    icon = "🔍"

    exam_config = ExamConfig(
        total_questions=325,
        duration_minutes=390,
        passing_score=0.75,
        sections=[
            {"part": 1, "name": "内部監査の基礎", "questions": 125, "duration_min": 150, "weight_pct": 33.3},
            {"part": 2, "name": "内部監査の実務", "questions": 100, "duration_min": 120, "weight_pct": 33.3},
            {"part": 3, "name": "ビジネス知識", "questions": 100, "duration_min": 120, "weight_pct": 33.3},
        ],
        format_notes="IIA（内部監査人協会）認定。4択MCQ。3パート各独立受験。"
        "スケールドスコア600/750（≒正答率75%）で合格。"
        "Global Internal Audit Standards(2024年改訂)準拠。",
    )

    def get_syllabus(self) -> list[TopicDef]:
        return [
            TopicDef(
                name="Part 1: 内部監査の基礎",
                weight_pct=33.3,
                children=[
                    TopicDef(
                        name="内部監査の基盤",
                        weight_pct=15.0,
                        keywords=["IIA使命", "内部監査の定義", "倫理綱要", "独立性"],
                    ),
                    TopicDef(
                        name="独立性と客観性",
                        weight_pct=15.0,
                        keywords=["機能的報告", "利益相反", "独立性の阻害"],
                    ),
                    TopicDef(
                        name="内部監査の熟達",
                        weight_pct=18.0,
                        keywords=["専門的能力", "正当な注意", "継続的専門能力開発"],
                    ),
                    TopicDef(
                        name="品質のアシュアランスと改善",
                        weight_pct=7.0,
                        keywords=["品質評価", "内部評価", "外部評価"],
                    ),
                    TopicDef(
                        name="ガバナンス、リスク、コントロール",
                        weight_pct=35.0,
                        keywords=["コーポレートガバナンス", "ERM", "COSO", "内部統制"],
                    ),
                    TopicDef(
                        name="不正リスク",
                        weight_pct=10.0,
                        keywords=["不正トライアングル", "不正の兆候", "不正調査"],
                    ),
                ],
            ),
            TopicDef(
                name="Part 2: 内部監査の実務",
                weight_pct=33.3,
                children=[
                    TopicDef(
                        name="内部監査部門の管理",
                        weight_pct=20.0,
                        keywords=["監査計画", "資源配分", "方針と手続"],
                    ),
                    TopicDef(
                        name="個々の業務の管理",
                        weight_pct=20.0,
                        keywords=["業務計画", "リスク評価", "業務目的"],
                    ),
                    TopicDef(
                        name="不正とテクノロジー",
                        weight_pct=20.0,
                        keywords=["データ分析", "IT監査", "CAATT"],
                    ),
                    TopicDef(
                        name="業務の実施",
                        weight_pct=25.0,
                        keywords=["情報収集", "分析と評価", "業務調書"],
                    ),
                    TopicDef(
                        name="業務結果の報告と伝達",
                        weight_pct=15.0,
                        keywords=["監査報告書", "発見事項", "勧告"],
                    ),
                ],
            ),
            TopicDef(
                name="Part 3: ビジネス知識",
                weight_pct=33.3,
                children=[
                    TopicDef(
                        name="ビジネス感覚",
                        weight_pct=35.0,
                        keywords=["戦略計画", "組織構造", "プロセス管理"],
                    ),
                    TopicDef(
                        name="情報セキュリティ",
                        weight_pct=25.0,
                        keywords=["情報資産保護", "アクセス制御", "暗号化"],
                    ),
                    TopicDef(
                        name="情報技術",
                        weight_pct=20.0,
                        keywords=["ITガバナンス", "システム開発", "BCP/DR"],
                    ),
                    TopicDef(
                        name="財務管理",
                        weight_pct=20.0,
                        keywords=["財務諸表", "予算管理", "資本予算"],
                    ),
                ],
            ),
        ]

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
