"""簿記1級 (日商簿記検定1級) プラグイン"""

from src.plugins.base import CoursePlugin, ExamConfig, SynergyDef, TopicDef


class Boki1Plugin(CoursePlugin):
    course_code = "BOKI1"
    course_name = "日商簿記検定1級"
    description = "日本商工会議所主催の簿記検定最上位。会計学・工業簿記を含む高度な簿記知識"
    color = "#d97706"
    icon = "📒"

    exam_config = ExamConfig(
        total_questions=100,
        duration_minutes=180,
        passing_score=0.70,
        sections=[
            {"part": 1, "name": "商業簿記", "points": 25, "duration_min": 90, "weight_pct": 25},
            {"part": 2, "name": "会計学", "points": 25, "duration_min": 90, "weight_pct": 25},
            {"part": 3, "name": "工業簿記", "points": 25, "duration_min": 90, "weight_pct": 25},
            {"part": 4, "name": "原価計算", "points": 25, "duration_min": 90, "weight_pct": 25},
        ],
        format_notes="日商簿記検定1級。4科目各25点の100点満点（問題数は回により変動）。"
        "前半(商業簿記+会計学)90分 → 休憩15分 → 後半(工業簿記+原価計算)90分。"
        "合格基準: 70点以上かつ各科目10点(40%)以上。"
        "記述式・計算問題中心。年2回(6月・11月)統一試験のみ。",
    )

    def get_syllabus(self) -> list[TopicDef]:
        return [
            TopicDef(
                name="商業簿記",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="特殊商品売買・収益認識",
                        weight_pct=20.0,
                        keywords=["委託販売", "試用販売", "割賦販売", "収益認識基準"],
                    ),
                    TopicDef(
                        name="連結会計",
                        weight_pct=25.0,
                        keywords=["連結修正仕訳", "持分法", "非支配株主持分", "連結CF"],
                    ),
                    TopicDef(
                        name="企業結合・事業分離",
                        weight_pct=20.0,
                        keywords=["吸収合併", "新設合併", "のれん", "事業分離"],
                    ),
                    TopicDef(
                        name="金融商品会計",
                        weight_pct=20.0,
                        keywords=["デリバティブ", "ヘッジ会計", "有価証券", "減損"],
                    ),
                    TopicDef(
                        name="外貨換算・在外子会社",
                        weight_pct=15.0,
                        keywords=["為替予約", "在外子会社", "機能通貨", "換算差額"],
                    ),
                ],
            ),
            TopicDef(
                name="会計学",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="財務諸表論",
                        weight_pct=25.0,
                        keywords=["概念フレームワーク", "会計基準", "ASBJ", "IFRS"],
                    ),
                    TopicDef(
                        name="税効果会計",
                        weight_pct=25.0,
                        keywords=["繰延税金資産", "繰延税金負債", "一時差異", "回収可能性"],
                    ),
                    TopicDef(
                        name="退職給付会計",
                        weight_pct=25.0,
                        keywords=["退職給付債務", "年金資産", "数理計算上の差異", "過去勤務費用"],
                    ),
                    TopicDef(
                        name="リース・資産除去債務",
                        weight_pct=25.0,
                        keywords=["ファイナンスリース", "オペレーティングリース", "資産除去債務", "割引計算"],
                    ),
                ],
            ),
            TopicDef(
                name="工業簿記",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="個別原価計算・総合原価計算",
                        weight_pct=30.0,
                        keywords=["製造間接費配賦", "仕損", "減損", "等級別原価計算"],
                    ),
                    TopicDef(
                        name="標準原価計算",
                        weight_pct=30.0,
                        keywords=["標準原価カード", "差異分析", "配合差異", "歩留差異"],
                    ),
                    TopicDef(
                        name="直接原価計算",
                        weight_pct=20.0,
                        keywords=["変動費", "固定費", "貢献利益", "固変分解"],
                    ),
                    TopicDef(
                        name="本社工場会計",
                        weight_pct=20.0,
                        keywords=["工場会計独立", "内部振替価格", "本社勘定", "工場勘定"],
                    ),
                ],
            ),
            TopicDef(
                name="原価計算",
                weight_pct=25.0,
                children=[
                    TopicDef(
                        name="CVP分析・損益分岐点",
                        weight_pct=25.0,
                        keywords=["損益分岐点", "安全余裕率", "感度分析", "多品種CVP"],
                    ),
                    TopicDef(
                        name="意思決定会計",
                        weight_pct=25.0,
                        keywords=["差額原価", "埋没原価", "機会原価", "セグメント別損益"],
                    ),
                    TopicDef(
                        name="予算管理",
                        weight_pct=25.0,
                        keywords=["予算編成", "予算実績差異分析", "弾力性予算", "BSC"],
                    ),
                    TopicDef(
                        name="戦略的原価管理",
                        weight_pct=25.0,
                        keywords=["ABC", "ABM", "品質原価計算", "ライフサイクルコスティング"],
                    ),
                ],
            ),
        ]

    def get_synergy_areas(self) -> list[SynergyDef]:
        return [
            SynergyDef(
                area_name="財務会計・財務報告",
                overlap_pct=88.0,
                related_courses=["USCPA", "CIA"],
                term_mappings={
                    "BOKI1": "日本基準(ASBJ)に基づく財務諸表作成",
                    "USCPA": "US GAAP/IFRS に基づくFAR(Financial Accounting and Reporting)",
                    "CIA": "財務諸表分析・内部監査視点での会計検証",
                },
            ),
            SynergyDef(
                area_name="原価計算・管理会計",
                overlap_pct=85.0,
                related_courses=["USCPA"],
                term_mappings={
                    "BOKI1": "工業簿記・原価計算(標準/直接/ABC)",
                    "USCPA": "BAR - 原価計算・管理会計(Cost Accounting)",
                },
            ),
            SynergyDef(
                area_name="連結会計・企業結合",
                overlap_pct=82.0,
                related_courses=["USCPA"],
                term_mappings={
                    "BOKI1": "連結修正仕訳・持分法・のれん",
                    "USCPA": "FAR - Consolidation・Business Combinations",
                },
            ),
            SynergyDef(
                area_name="監査と会計基準の理解",
                overlap_pct=75.0,
                related_courses=["CIA", "USCPA"],
                term_mappings={
                    "BOKI1": "会計基準の理論的理解(概念フレームワーク)",
                    "CIA": "内部監査における会計基準の検証",
                    "USCPA": "AUD - 会計基準準拠性の監査",
                },
            ),
        ]
