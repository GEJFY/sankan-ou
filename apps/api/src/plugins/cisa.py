"""CISA (Certified Information Systems Auditor) プラグイン"""

from src.plugins.base import CoursePlugin, ExamConfig, SynergyDef, TopicDef


class CISAPlugin(CoursePlugin):
    course_code = "CISA"
    course_name = "Certified Information Systems Auditor（公認情報システム監査人）"
    description = "ISACA認定の情報システム監査・コントロールの国際資格"
    color = "#0891b2"
    icon = "🖥️"

    exam_config = ExamConfig(
        total_questions=150,
        duration_minutes=240,
        passing_score=0.45,  # スケールドスコア450/800
        sections=[
            {"domain": 1, "name": "情報システム監査のプロセス", "weight_pct": 21.0},
            {"domain": 2, "name": "ITガバナンスとマネジメント", "weight_pct": 17.0},
            {"domain": 3, "name": "情報システムの取得・開発・導入", "weight_pct": 12.0},
            {"domain": 4, "name": "情報システムの運用とレジリエンス", "weight_pct": 23.0},
            {"domain": 5, "name": "情報資産の保護", "weight_pct": 27.0},
        ],
        format_notes="ISACA（情報システムコントロール協会）の試験スタイル。4択問題。"
        "ITガバナンス、セキュリティ、監査プロセスに焦点。COBIT/ITIL準拠。",
    )

    def get_syllabus(self) -> list[TopicDef]:
        return [
            TopicDef(
                name="Domain 1: 情報システム監査のプロセス",
                weight_pct=21.0,
                children=[
                    TopicDef(
                        name="IS監査の計画",
                        weight_pct=8.0,
                        keywords=["監査計画", "リスクベースアプローチ", "監査基準"],
                    ),
                    TopicDef(
                        name="IS監査の実施",
                        weight_pct=8.0,
                        keywords=["証拠収集", "統制テスト", "実証テスト"],
                    ),
                    TopicDef(
                        name="IS監査の報告",
                        weight_pct=5.0,
                        keywords=["監査報告書", "発見事項", "フォローアップ"],
                    ),
                ],
            ),
            TopicDef(
                name="Domain 2: ITガバナンスとマネジメント",
                weight_pct=17.0,
                children=[
                    TopicDef(
                        name="ITガバナンス",
                        weight_pct=9.0,
                        keywords=["COBIT", "ITガバナンス構造", "IT戦略"],
                    ),
                    TopicDef(
                        name="IT管理",
                        weight_pct=8.0,
                        keywords=["IT組織", "IT人材管理", "IT品質管理"],
                    ),
                ],
            ),
            TopicDef(
                name="Domain 3: 情報システムの取得・開発・導入",
                weight_pct=12.0,
                children=[
                    TopicDef(
                        name="システム開発ライフサイクル",
                        weight_pct=6.0,
                        keywords=["SDLC", "要件定義", "設計", "テスト"],
                    ),
                    TopicDef(
                        name="プロジェクト管理",
                        weight_pct=6.0,
                        keywords=["PMBOK", "アジャイル", "変更管理"],
                    ),
                ],
            ),
            TopicDef(
                name="Domain 4: 情報システムの運用とレジリエンス",
                weight_pct=23.0,
                children=[
                    TopicDef(
                        name="IT運用管理",
                        weight_pct=10.0,
                        keywords=["ITIL", "インシデント管理", "問題管理"],
                    ),
                    TopicDef(
                        name="事業継続管理",
                        weight_pct=8.0,
                        keywords=["BCP", "DRP", "RTO/RPO"],
                    ),
                    TopicDef(
                        name="データベース管理",
                        weight_pct=5.0,
                        keywords=["データ管理", "データ品質", "データガバナンス"],
                    ),
                ],
            ),
            TopicDef(
                name="Domain 5: 情報資産の保護",
                weight_pct=27.0,
                children=[
                    TopicDef(
                        name="情報セキュリティ管理",
                        weight_pct=10.0,
                        keywords=["セキュリティポリシー", "セキュリティフレームワーク"],
                    ),
                    TopicDef(
                        name="アクセス制御",
                        weight_pct=7.0,
                        keywords=["認証", "認可", "ID管理", "特権管理"],
                    ),
                    TopicDef(
                        name="ネットワークセキュリティ",
                        weight_pct=5.0,
                        keywords=["ファイアウォール", "IDS/IPS", "VPN", "暗号化"],
                    ),
                    TopicDef(
                        name="脆弱性管理",
                        weight_pct=5.0,
                        keywords=["脆弱性スキャン", "ペネトレーションテスト", "パッチ管理"],
                    ),
                ],
            ),
        ]

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
