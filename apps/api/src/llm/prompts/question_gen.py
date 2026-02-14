"""問題自動生成プロンプト"""


def build_question_gen_prompt(
    topic_name: str,
    course_code: str,
    count: int = 3,
    difficulty: int = 2,
) -> tuple[str, str]:
    """問題生成プロンプト → (system, user)"""
    difficulty_desc = {
        1: "基礎レベル（用語の定義、基本概念の確認）",
        2: "標準レベル（概念の理解、適用場面の判断）",
        3: "応用レベル（ケーススタディ、複合的な判断）",
        4: "発展レベル（実務シナリオ、批判的思考）",
        5: "専門家レベル（高度な分析、規準の解釈）",
    }.get(difficulty, "標準レベル")

    exam_style = {
        "CIA": "IIA（内部監査人協会）の試験スタイル。4択問題。実務的なシナリオベースの問題を含む。",
        "CISA": "ISACA（情報システムコントロール協会）の試験スタイル。4択問題。ITガバナンスとセキュリティに焦点。",
        "CFE": "ACFE（公認不正検査士協会）の試験スタイル。True/False + 4択。法律と調査手法に焦点。",
    }.get(course_code, "4択問題形式")

    system = f"""あなたは{course_code}試験の問題作成の専門家です。
{exam_style}

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
- 選択肢の順番はランダムに（正解が常にBにならないように）
- 実務に即した実践的な問題を作成
- {difficulty_desc}"""

    user = f"""以下のトピックについて、{count}問の練習問題を作成してください:

トピック: {topic_name}
資格: {course_code}
難易度: {difficulty_desc}

JSON形式で出力してください。"""

    return system, user
