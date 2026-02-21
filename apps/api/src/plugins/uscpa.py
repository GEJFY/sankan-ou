"""USCPA (U.S. Certified Public Accountant) プラグイン"""

from src.plugins.base import CoursePlugin, ExamConfig, SynergyDef, TopicDef


class USCPAPlugin(CoursePlugin):
    course_code = "USCPA"
    course_name = "U.S. CPA（米国公認会計士）"
    description = "AICPA/NASBA認定の米国公認会計士資格。2024年新試験制度(CPA Evolution)対応"
    color = "#059669"
    icon = "💼"

    exam_config = ExamConfig(
        total_questions=279,
        duration_minutes=960,
        passing_score=0.75,
        sections=[
            {"part": 1, "name": "AUD (Auditing and Attestation)", "mcq": 78, "tbs": 7, "questions": 85, "weight_pct": 25},
            {"part": 2, "name": "FAR (Financial Accounting and Reporting)", "mcq": 50, "tbs": 7, "questions": 57, "weight_pct": 25},
            {"part": 3, "name": "REG (Taxation and Regulation)", "mcq": 72, "tbs": 8, "questions": 80, "weight_pct": 25},
            {"part": 4, "name": "Discipline (BAR/ISC/TCP)", "mcq": 50, "tbs": 7, "questions": 57, "weight_pct": 25},
        ],
        format_notes="AICPA Uniform CPA Examination（CPA Evolution 2024年新制度）。"
        "Core 3科目(AUD/FAR/REG) + Discipline 1科目(BAR/ISC/TCP)選択。"
        "各4時間。MCQ 50% + TBS 50%の配点比率。"
        "スケールドスコア75/99で合格（正答率≒60-65%目安）。",
    )

    def get_syllabus(self) -> list[TopicDef]:
        return [
            TopicDef(
                name="AUD: Auditing and Attestation",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="監査の倫理・独立性・品質管理",
                        weight_pct=15.0,
                        keywords=["AICPA倫理規程", "独立性", "品質管理基準", "SQCS"],
                    ),
                    TopicDef(
                        name="監査業務の計画と実施",
                        weight_pct=30.0,
                        keywords=["リスク評価", "重要性", "分析的手続", "サンプリング"],
                    ),
                    TopicDef(
                        name="内部統制の評価",
                        weight_pct=20.0,
                        keywords=["COSO", "IT統制", "統制テスト", "統制の欠陥"],
                    ),
                    TopicDef(
                        name="監査報告書",
                        weight_pct=20.0,
                        keywords=["無限定適正意見", "限定意見", "不適正意見", "意見不表明"],
                    ),
                    TopicDef(
                        name="その他の保証・証明業務",
                        weight_pct=15.0,
                        keywords=["レビュー業務", "コンピレーション", "SOC報告書", "SSAE"],
                    ),
                ],
            ),
            TopicDef(
                name="FAR: Financial Accounting and Reporting",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="財務会計の基礎",
                        weight_pct=20.0,
                        keywords=["GAAP概念フレームワーク", "ASC", "収益認識", "リース会計"],
                    ),
                    TopicDef(
                        name="資産の会計処理",
                        weight_pct=20.0,
                        keywords=["棚卸資産", "有形固定資産", "減損", "投資"],
                    ),
                    TopicDef(
                        name="負債・資本の会計処理",
                        weight_pct=20.0,
                        keywords=["社債", "年金会計", "株主資本", "EPS"],
                    ),
                    TopicDef(
                        name="政府会計・非営利会計",
                        weight_pct=20.0,
                        keywords=["GASB", "修正発生主義", "ファンド会計", "非営利体"],
                    ),
                    TopicDef(
                        name="連結財務諸表",
                        weight_pct=20.0,
                        keywords=["企業結合", "連結手続", "セグメント報告", "外貨換算"],
                    ),
                ],
            ),
            TopicDef(
                name="REG: Taxation and Regulation",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="個人所得税",
                        weight_pct=25.0,
                        keywords=["Gross Income", "控除", "クレジット", "AMT"],
                    ),
                    TopicDef(
                        name="法人税",
                        weight_pct=25.0,
                        keywords=["法人所得税", "S Corporation", "Partnership", "LLC"],
                    ),
                    TopicDef(
                        name="ビジネス法",
                        weight_pct=25.0,
                        keywords=["契約法", "UCC", "代理法", "破産法"],
                    ),
                    TopicDef(
                        name="連邦税務手続",
                        weight_pct=25.0,
                        keywords=["IRS", "税務申告", "罰則", "税務訴訟"],
                    ),
                ],
            ),
            TopicDef(
                name="BAR: Business Analysis and Reporting (Discipline)",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="財務データ分析",
                        weight_pct=30.0,
                        keywords=["財務分析", "比率分析", "トレンド分析", "予測モデル"],
                    ),
                    TopicDef(
                        name="技術的会計・報告",
                        weight_pct=40.0,
                        keywords=["デリバティブ", "ヘッジ会計", "IFRS", "SEC報告"],
                    ),
                    TopicDef(
                        name="原価計算・管理会計",
                        weight_pct=30.0,
                        keywords=["原価計算", "CVP分析", "予算管理", "差異分析"],
                    ),
                ],
            ),
        ]

    def get_synergy_areas(self) -> list[SynergyDef]:
        return [
            SynergyDef(
                area_name="監査プロセス・方法論",
                overlap_pct=90.0,
                related_courses=["CIA", "CISA"],
                term_mappings={
                    "USCPA": "Audit Risk Model (AR = IR × CR × DR)",
                    "CIA": "リスクベース内部監査アプローチ",
                    "CISA": "IS監査のリスクベースアプローチ",
                },
            ),
            SynergyDef(
                area_name="内部統制フレームワーク (COSO)",
                overlap_pct=92.0,
                related_courses=["CIA", "CISA", "CFE"],
                term_mappings={
                    "USCPA": "COSO Internal Control - Integrated Framework",
                    "CIA": "統制環境・リスク評価・統制活動・情報と伝達・モニタリング",
                    "CFE": "不正防止のための統制環境",
                },
            ),
            SynergyDef(
                area_name="不正リスク評価",
                overlap_pct=85.0,
                related_courses=["CIA", "CFE"],
                term_mappings={
                    "USCPA": "SAS 99 不正リスク要因の考慮",
                    "CIA": "不正トライアングル評価",
                    "CFE": "不正検査手法・調査プロセス",
                },
            ),
            SynergyDef(
                area_name="企業ガバナンス",
                overlap_pct=80.0,
                related_courses=["CIA", "CISA"],
                term_mappings={
                    "USCPA": "SOX法コンプライアンス",
                    "CIA": "取締役会への報告・ガバナンス構造",
                    "CISA": "ITガバナンスフレームワーク",
                },
            ),
        ]
