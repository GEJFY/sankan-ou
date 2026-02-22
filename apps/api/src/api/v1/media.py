"""Media endpoints - 音声/スライド学習"""

import json
import logging
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.llm.client import generate, MODEL_SONNET
from src.llm.gemini_client import generate_slide_image, generate_text as gemini_generate_text, is_gemini_available

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/media", tags=["media"])


class GenerateSlideRequest(BaseModel):
    topic: str
    course_code: str = "CIA"
    slide_count: int = Field(default=8, ge=3, le=20)
    level: int = Field(default=4, ge=1, le=6)


class GenerateAudioScriptRequest(BaseModel):
    topic: str
    course_code: str = "CIA"
    duration_minutes: int = Field(default=5, ge=1, le=15)
    level: int = Field(default=4, ge=1, le=6)


def _extract_json(raw: str, expect_array: bool = True):
    """LLM応答からJSONを安全に抽出する（ロバスト版）"""
    text = raw.strip()
    # ```json ... ``` ブロック除去
    if "```" in text:
        match = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
        if match:
            text = match.group(1).strip()

    open_char = "[" if expect_array else "{"
    close_char = "]" if expect_array else "}"

    start = text.find(open_char)
    if start == -1:
        raise ValueError(f"JSON{'配列' if expect_array else 'オブジェクト'}が見つかりません")

    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == open_char:
            depth += 1
        elif ch == close_char:
            depth -= 1
            if depth == 0:
                candidate = text[start : i + 1]
                return json.loads(candidate)
    return json.loads(text)


@router.post("/slides/generate")
async def generate_slides(body: GenerateSlideRequest):
    """AIスライド自動生成"""
    system = f"""あなたは{body.course_code}資格の教育コンテンツ制作の専門家です。
指定されたトピックについて、正確に{body.slide_count}枚のプレゼンテーションスライドを日本語で作成してください。

【重要ルール】
- すべてのテキスト（タイトル、箇条書き、ノート）は必ず日本語で記述してください
- 英語の専門用語を使う場合は必ず日本語の説明を添えてください（例: "COSO（トレッドウェイ委員会支援組織委員会）"）
- 1スライド = 1つの概念（情報を詰め込みすぎないこと）
- 各スライドにタイトル、本文（箇条書き3〜5点）、プレゼンターノートを必ず含めること
- 箇条書きの各項目は簡潔かつ具体的に（曖昧な表現は避ける）
- 図解やフローチャートが有効な箇所は visual フィールドに日本語で具体的な図の説明を記載
- 最後のスライドは「まとめ」とし、学習のポイントを整理すること
- 資格試験の出題範囲に沿った正確な内容であること

【出力形式】（JSON配列のみ出力。それ以外のテキストは含めないこと）
[
  {{
    "slide_number": 1,
    "title": "スライドタイトル（日本語）",
    "content": ["箇条書き1（日本語）", "箇条書き2（日本語）", "箇条書き3（日本語）"],
    "notes": "プレゼンターノート（日本語）",
    "visual": "図解の説明（日本語、あれば。なければ空文字）"
  }}
]"""

    user_prompt = f"トピック「{body.topic}」について{body.slide_count}枚の学習スライドを日本語で作成してください。{body.course_code}資格の試験範囲に準拠した正確な内容としてください。"

    # Azure LLM → Gemini の順でフォールバック
    result = None
    try:
        result = await generate(
            user_prompt,
            system=system,
            model=MODEL_SONNET,
            max_tokens=8192,
        )
    except Exception as e:
        logger.info(f"Azure LLM unavailable, trying Gemini fallback: {e}")
        if is_gemini_available():
            try:
                result = await gemini_generate_text(user_prompt, system=system)
            except Exception as e2:
                raise HTTPException(status_code=502, detail=f"スライド生成に失敗しました: {e2}")
        else:
            raise HTTPException(status_code=502, detail=f"スライド生成に失敗しました: {e}")

    # ロバストJSONパース
    try:
        slides = _extract_json(result, expect_array=True)
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"Slide JSON parse failed: {e}, raw length={len(result)}")
        slides = [{"slide_number": 1, "title": "生成エラー", "content": [result[:500]], "notes": "JSONパースに失敗しました。再生成をお試しください。"}]

    # スライドデータのバリデーション・正規化
    validated_slides = []
    for idx, slide in enumerate(slides):
        validated = {
            "slide_number": slide.get("slide_number", idx + 1),
            "title": slide.get("title", f"スライド {idx + 1}"),
            "content": slide.get("content", []),
            "notes": slide.get("notes", ""),
            "visual": slide.get("visual", ""),
        }
        # content が文字列の場合は配列に変換
        if isinstance(validated["content"], str):
            validated["content"] = [validated["content"]]
        # content の各要素を文字列に確実に変換
        validated["content"] = [str(item) for item in validated["content"] if item]
        validated_slides.append(validated)

    slides = validated_slides

    # Gemini利用可能時: 各スライドにビジュアル画像を付与
    if is_gemini_available():
        for slide in slides:
            try:
                img_result = await generate_slide_image(
                    topic=body.topic,
                    course_code=body.course_code,
                    slide_number=slide.get("slide_number", 1),
                    total_slides=len(slides),
                    content_points=slide.get("content", []),
                )
                if img_result.get("image_base64"):
                    slide["image_base64"] = img_result["image_base64"]
                    slide["image_mime_type"] = img_result["mime_type"]
            except Exception as e:
                logger.warning(f"Gemini image generation failed for slide {slide.get('slide_number')}: {e}")

    return {
        "topic": body.topic,
        "course_code": body.course_code,
        "slide_count": len(slides),
        "slides": slides,
        "has_images": any(s.get("image_base64") for s in slides),
    }


@router.post("/audio/script")
async def generate_audio_script(body: GenerateAudioScriptRequest):
    """音声解説スクリプト生成"""
    from src.llm.prompts.tutor import LEVEL_DESCRIPTIONS

    level_desc = LEVEL_DESCRIPTIONS.get(body.level, LEVEL_DESCRIPTIONS[4])

    system = f"""あなたは{body.course_code}資格の音声教材制作の専門家です。
指定されたトピックについて、約{body.duration_minutes}分間の音声解説スクリプトを日本語で作成してください。

レベル: {level_desc}

【重要ルール】
- すべてのテキストは日本語で記述すること
- 口語体で自然に話すように
- 「さて」「ここで重要なのは」などの接続表現を使う
- 理解度チェック質問を2〜3箇所に挿入
- セクション区切りを明確にする
- 約{body.duration_minutes * 150}文字（1分約150文字で読み上げ）

【出力形式】（JSONオブジェクトのみ出力。それ以外のテキストは含めないこと）
{{
  "title": "タイトル（日本語）",
  "estimated_duration_min": {body.duration_minutes},
  "sections": [
    {{
      "title": "セクションタイトル（日本語）",
      "script": "スクリプト本文（日本語）...",
      "check_question": "理解度チェック質問（日本語、あれば）"
    }}
  ]
}}"""

    user_prompt = f"トピック「{body.topic}」の音声解説スクリプトを日本語で作成してください。{body.course_code}資格の内容に準拠してください。"

    result = None
    try:
        result = await generate(
            user_prompt,
            system=system,
            model=MODEL_SONNET,
            max_tokens=8192,
        )
    except Exception as e:
        logger.info(f"Azure LLM unavailable for audio, trying Gemini fallback: {e}")
        if is_gemini_available():
            try:
                result = await gemini_generate_text(user_prompt, system=system)
            except Exception as e2:
                raise HTTPException(status_code=502, detail=f"音声スクリプト生成に失敗しました: {e2}")
        else:
            raise HTTPException(status_code=502, detail=f"音声スクリプト生成に失敗しました: {e}")

    try:
        script = _extract_json(result, expect_array=False)
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"Audio JSON parse failed: {e}")
        script = {
            "title": body.topic,
            "estimated_duration_min": body.duration_minutes,
            "sections": [{"title": "スクリプト", "script": result[:1000]}],
        }

    return {
        "topic": body.topic,
        "course_code": body.course_code,
        **script,
        "tts_status": "not_implemented",
        "tts_note": "TTS音声生成は将来的にGoogle Cloud TTS/ElevenLabsで実装予定",
    }


@router.get("/capabilities")
async def get_media_capabilities():
    """メディア機能の対応状況"""
    gemini_available = is_gemini_available()
    return {
        "slides": {
            "status": "available",
            "description": "AI自動スライド生成" + (" (テキスト+画像: Gemini)" if gemini_available else " (テキスト形式)"),
            "has_image_generation": gemini_available,
            "export_formats": ["json"],
            "planned_formats": ["pptx", "pdf"],
        },
        "audio": {
            "script_generation": {
                "status": "available",
                "description": "音声解説スクリプト生成",
            },
            "tts": {
                "status": "planned",
                "description": "Text-to-Speech音声生成",
                "planned_providers": ["Google Cloud TTS", "ElevenLabs"],
            },
            "playback": {
                "status": "planned",
                "description": "ブラウザ内音声再生",
                "planned_features": ["速度調整", "バックグラウンド再生"],
            },
        },
    }
