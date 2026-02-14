"""CoursePlugin 基底クラス - 資格別設定の抽象化"""

from dataclasses import dataclass, field


@dataclass
class ExamConfig:
    """試験形式設定"""

    total_questions: int
    duration_minutes: int
    passing_score: float  # 0.0-1.0
    sections: list[dict] = field(default_factory=list)
    format_notes: str = ""


@dataclass
class TopicDef:
    """シラバストピック定義"""

    name: str
    weight_pct: float = 0.0
    children: list["TopicDef"] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)


@dataclass
class SynergyDef:
    """シナジー定義 (他資格との重複)"""

    area_name: str
    overlap_pct: float
    related_courses: list[str]  # course_code list
    term_mappings: dict[str, str] = field(default_factory=dict)


@dataclass
class LevelConfig:
    """レベル別解説設定"""

    level: int
    label: str
    persona: str  # LLMに渡すペルソナ説明


# デフォルト6段階
DEFAULT_LEVELS: list[LevelConfig] = [
    LevelConfig(1, "小学生", "小学6年生に教える先生のように、身近な例えを使って"),
    LevelConfig(2, "中学生", "中学生に基本概念を丁寧に、因果関係を含めて"),
    LevelConfig(3, "高校生", "高校生に論理的に構造化して、専門用語を少しずつ導入して"),
    LevelConfig(4, "大学生", "大学の講義のように、専門用語を交えて体系的に"),
    LevelConfig(5, "実務者", "実務経験のあるプロフェッショナルに、ケーススタディを含めて"),
    LevelConfig(6, "公認会計士", "CPA/CIA/CISA取得済みの専門家に、規準・基準の解釈を含めて"),
]


class CoursePlugin:
    """資格コースプラグイン基底クラス

    新しい資格を追加する際はこのクラスを継承して実装する。
    """

    # --- 必須オーバーライド ---
    course_code: str = ""
    course_name: str = ""
    description: str = ""
    color: str = "#666666"
    icon: str = "📚"

    # 試験設定
    exam_config: ExamConfig = ExamConfig(
        total_questions=100, duration_minutes=150, passing_score=0.75
    )

    # レベル別解説
    levels: list[LevelConfig] = DEFAULT_LEVELS

    def get_syllabus(self) -> list[TopicDef]:
        """シラバストピック階層を返す"""
        raise NotImplementedError

    def get_synergy_areas(self) -> list[SynergyDef]:
        """他資格との知識重複定義を返す"""
        return []

    def get_question_gen_system_prompt(self, difficulty: int = 2) -> str:
        """問題生成用システムプロンプトを返す"""
        difficulty_desc = {
            1: "基礎レベル（用語の定義、基本概念の確認）",
            2: "標準レベル（概念の理解、適用場面の判断）",
            3: "応用レベル（ケーススタディ、複合的な判断）",
            4: "発展レベル（実務シナリオ、批判的思考）",
            5: "専門家レベル（高度な分析、規準の解釈）",
        }.get(difficulty, "標準レベル")

        return f"""あなたは{self.course_code}試験の問題作成の専門家です。
{self.exam_config.format_notes}

難易度: {difficulty_desc}

出力は必ず以下のJSON形式で返してください:
[
  {{
    "stem": "問題文",
    "choices": [
      {{"text": "選択肢A", "is_correct": false, "explanation": "なぜ不正解か"}},
      {{"text": "選択肢B", "is_correct": true, "explanation": "なぜ正解か"}},
      {{"text": "選択肢C", "is_correct": false, "explanation": "なぜ不正解か"}},
      {{"text": "選択肢D", "is_correct": false, "explanation": "なぜ不正解か"}}
    ],
    "explanation": "全体の解説",
    "difficulty": {difficulty}
  }}
]

ルール:
- 正解は各問題で1つだけ
- 選択肢の順番はランダムに
- 実務に即した実践的な問題を作成"""

    def get_card_gen_prompt(self, topic_name: str) -> str:
        """カード自動生成用プロンプトを返す"""
        return f"""以下のトピックについて、{self.course_code}試験向けの学習カードを作成してください。

トピック: {topic_name}
資格: {self.course_name}

各カードは以下のJSON形式で出力:
[
  {{
    "front": "問い（簡潔な質問文）",
    "back": "答え（明確で正確な回答）",
    "difficulty_tier": 1,
    "tags": ["タグ1", "タグ2"]
  }}
]

ルール:
- difficulty_tier: 1=基礎, 2=応用, 3=発展
- 1トピックにつき3-5枚のカードを生成
- 表面は明確な問い、裏面は正確な回答"""
