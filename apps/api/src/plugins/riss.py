"""RISS (情報処理安全確保支援士) プラグイン"""

from src.plugins.base import CoursePlugin, ExamConfig, SynergyDef, TopicDef


class RISSPlugin(CoursePlugin):
    course_code = "RISS"
    course_name = "情報処理安全確保支援士"
    description = "IPA情報処理技術者試験の高度区分。サイバーセキュリティの国家資格(登録セキスペ)"
    color = "#dc2626"
    icon = "🔐"

    exam_config = ExamConfig(
        total_questions=95,
        duration_minutes=320,
        passing_score=0.60,
        sections=[
            {"part": 1, "name": "午前I (共通知識)", "questions": 30, "weight_pct": 15},
            {"part": 2, "name": "午前II (専門知識)", "questions": 25, "weight_pct": 20},
            {"part": 3, "name": "午後I (記述式)", "questions": 3, "weight_pct": 30},
            {"part": 4, "name": "午後II (論述式)", "questions": 2, "weight_pct": 35},
        ],
        format_notes="IPA情報処理安全確保支援士試験(SC)。午前I(50分)/午前II(40分)/午後(150分)。"
        "2023年度から午後は午後I・IIを統合。合格基準は各60点以上。"
        "年2回(4月・10月)実施。合格後は登録によりRISS(登録セキスペ)名称使用可。",
    )

    def get_syllabus(self) -> list[TopicDef]:
        return [
            TopicDef(
                name="情報セキュリティ",
                weight_pct=30.0,
                children=[
                    TopicDef(
                        name="暗号技術",
                        weight_pct=25.0,
                        keywords=["共通鍵暗号", "公開鍵暗号", "ハッシュ関数", "デジタル署名"],
                    ),
                    TopicDef(
                        name="認証技術",
                        weight_pct=25.0,
                        keywords=["PKI", "電子証明書", "多要素認証", "OAuth/OIDC"],
                    ),
                    TopicDef(
                        name="セキュリティプロトコル",
                        weight_pct=25.0,
                        keywords=["TLS/SSL", "IPsec", "SSH", "DNSSEC"],
                    ),
                    TopicDef(
                        name="攻撃手法と対策",
                        weight_pct=25.0,
                        keywords=["SQLインジェクション", "XSS", "CSRF", "バッファオーバーフロー"],
                    ),
                ],
            ),
            TopicDef(
                name="セキュリティマネジメント",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="情報セキュリティポリシー",
                        weight_pct=30.0,
                        keywords=["ISMS", "ISO27001", "リスクアセスメント", "セキュリティポリシー"],
                    ),
                    TopicDef(
                        name="インシデント対応",
                        weight_pct=35.0,
                        keywords=["CSIRT", "インシデントハンドリング", "フォレンジック", "BCP"],
                    ),
                    TopicDef(
                        name="法制度・ガイドライン",
                        weight_pct=35.0,
                        keywords=["個人情報保護法", "不正アクセス禁止法", "サイバーセキュリティ基本法", "NIST CSF"],
                    ),
                ],
            ),
            TopicDef(
                name="ネットワークセキュリティ",
                weight_pct=20.0,
                children=[
                    TopicDef(
                        name="ネットワーク基盤",
                        weight_pct=35.0,
                        keywords=["ファイアウォール", "IDS/IPS", "WAF", "DMZ"],
                    ),
                    TopicDef(
                        name="無線LAN・VPN",
                        weight_pct=30.0,
                        keywords=["WPA3", "VPN", "リモートアクセス", "ゼロトラスト"],
                    ),
                    TopicDef(
                        name="クラウドセキュリティ",
                        weight_pct=35.0,
                        keywords=["責任共有モデル", "CASB", "SASE", "コンテナセキュリティ"],
                    ),
                ],
            ),
            TopicDef(
                name="セキュア開発",
                weight_pct=15.0,
                children=[
                    TopicDef(
                        name="セキュアコーディング",
                        weight_pct=40.0,
                        keywords=["入力値検証", "エスケープ処理", "OWASP Top 10", "セキュアSDLC"],
                    ),
                    TopicDef(
                        name="脆弱性管理",
                        weight_pct=30.0,
                        keywords=["CVE", "CVSS", "パッチ管理", "脆弱性スキャン"],
                    ),
                    TopicDef(
                        name="認証・認可の実装",
                        weight_pct=30.0,
                        keywords=["セッション管理", "RBAC", "JWT", "APIセキュリティ"],
                    ),
                ],
            ),
            TopicDef(
                name="共通基盤技術",
                weight_pct=10.0,
                children=[
                    TopicDef(
                        name="OS・ミドルウェア",
                        weight_pct=50.0,
                        keywords=["Linux権限管理", "ログ管理", "マルウェア対策", "EDR"],
                    ),
                    TopicDef(
                        name="データベースセキュリティ",
                        weight_pct=50.0,
                        keywords=["アクセス制御", "暗号化", "監査ログ", "バックアップ"],
                    ),
                ],
            ),
        ]

    def get_synergy_areas(self) -> list[SynergyDef]:
        return [
            SynergyDef(
                area_name="情報セキュリティガバナンス",
                overlap_pct=88.0,
                related_courses=["CISA", "CIA"],
                term_mappings={
                    "RISS": "ISMS(ISO27001)・情報セキュリティポリシー策定",
                    "CISA": "IS監査におけるセキュリティ評価・COBIT",
                    "CIA": "ITガバナンスと内部統制のセキュリティ側面",
                },
            ),
            SynergyDef(
                area_name="IT統制・アクセス管理",
                overlap_pct=85.0,
                related_courses=["CISA", "CIA"],
                term_mappings={
                    "RISS": "認証・認可・アクセス制御(RBAC/ABAC)",
                    "CISA": "IS統制の設計・運用・評価",
                    "CIA": "IT全般統制(ITGC)と業務処理統制",
                },
            ),
            SynergyDef(
                area_name="インシデント対応・BCP",
                overlap_pct=80.0,
                related_courses=["CISA", "CIA"],
                term_mappings={
                    "RISS": "CSIRT運用・フォレンジック・インシデントハンドリング",
                    "CISA": "事業継続計画(BCP/DRP)・災害復旧",
                    "CIA": "リスクマネジメントとBCP策定",
                },
            ),
            SynergyDef(
                area_name="デジタルフォレンジック・不正調査",
                overlap_pct=75.0,
                related_courses=["CFE", "CISA"],
                term_mappings={
                    "RISS": "デジタルフォレンジック・証拠保全・ログ分析",
                    "CFE": "デジタル証拠の収集・不正調査におけるIT活用",
                    "CISA": "監査証跡・ログ分析によるIS監査",
                },
            ),
        ]
