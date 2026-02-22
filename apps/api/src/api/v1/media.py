"""Media endpoints - 音声/スライド学習"""

import json
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.llm.client import generate, MODEL_SONNET
from src.llm.gemini_client import generate_slide_image, generate_text as gemini_generate_text, is_gemini_available

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/media", tags=["media"])


class GenerateSlideRequest(BaseModel):
    topic: str
    course_code: str = "CIA"
    slide_count: int = Field(default=5, ge=3, le=10)
    level: int = Field(default=4, ge=1, le=6)


class GenerateAudioScriptRequest(BaseModel):
    topic: str
    course_code: str = "CIA"
    duration_minutes: int = Field(default=5, ge=1, le=15)
    level: int = Field(default=4, ge=1, le=6)


@router.post("/slides/generate")
async def generate_slides(body: GenerateSlideRequest):
    """AIスライド自動生成"""
    system = f"""あなたは{body.course_code}の教育コンテンツ制作の専門家です。
指定されたトピックについて、{body.slide_count}枚のプレゼンテーションスライドを作成してください。

ルール:
- 1スライド＝1概念（情報を詰め込みすぎない）
- 各スライドにタイトル、本文（箇条書き3-5点）、補足メモを含める
- 図解やフローチャートが有効な箇所は [図: 説明] と記載
- 最後のスライドは「まとめ」
- JSON形式で出力

出力形式:
[
  {{
    "slide_number": 1,
    "title": "スライドタイトル",
    "content": ["箇条書き1", "箇条書き2", "箇条書き3"],
    "notes": "プレゼンターノート",
    "visual": "図解の説明（あれば）"
  }}
]"""

    user_prompt = f"トピック「{body.topic}」について{body.slide_count}枚のスライドを作成してください。"

    # Azure LLM → Gemini の順でフォールバック
    result = None
    try:
        result = await generate(user_prompt, system=system, model=MODEL_SONNET)
    except Exception as e:
        logger.info(f"Azure LLM unavailable, trying Gemini fallback: {e}")
        if is_gemini_available():
            try:
                result = await gemini_generate_text(user_prompt, system=system)
            except Exception as e2:
                raise HTTPException(status_code=502, detail=f"スライド生成に失敗しました: {e2}")
        else:
            raise HTTPException(status_code=502, detail=f"スライド生成に失敗しました: {e}")

    # JSONパース試行
    try:
        # ```json...``` 形式の場合
        if "```" in result:
            json_str = result.split("```json")[-1].split("```")[0] if "```json" in result else result.split("```")[1].split("```")[0]
            slides = json.loads(json_str.strip())
        else:
            slides = json.loads(result)
    except (json.JSONDecodeError, IndexError):
        slides = [{"slide_number": 1, "title": "生成エラー", "content": [result[:200]], "notes": ""}]

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

    system = f"""あなたは{body.course_code}の音声教材制作の専門家です。
指定されたトピックについて、約{body.duration_minutes}分間の音声解説スクリプトを作成してください。

レベル: {level_desc}

スクリプトのルール:
- 口語体で自然に話すように
- 「さて」「ここで重要なのは」などの接続表現を使う
- 理解度チェック質問を2-3箇所に挿入（[CHECK] タグ）
- セクション区切りを明確に（[SECTION: タイトル]）
- 約{body.duration_minutes * 150}文字（1分約150語で読み上げ）

JSON形式で出力:
{{
  "title": "タイトル",
  "estimated_duration_min": {body.duration_minutes},
  "sections": [
    {{
      "title": "セクションタイトル",
      "script": "スクリプト本文...",
      "check_question": "理解度チェック質問（あれば）"
    }}
  ]
}}"""

    user_prompt = f"トピック「{body.topic}」の音声解説スクリプトを作成してください。"

    result = None
    try:
        result = await generate(user_prompt, system=system, model=MODEL_SONNET)
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
        if "```" in result:
            json_str = result.split("```json")[-1].split("```")[0] if "```json" in result else result.split("```")[1].split("```")[0]
            script = json.loads(json_str.strip())
        else:
            script = json.loads(result)
    except (json.JSONDecodeError, IndexError):
        script = {
            "title": body.topic,
            "estimated_duration_min": body.duration_minutes,
            "sections": [{"title": "スクリプト", "script": result[:500]}],
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
