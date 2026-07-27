"""Google Gemini client - Vertex AI / Direct API 両対応"""

import asyncio
import base64
import logging

from google import genai
from google.genai import types

from src.config import settings

logger = logging.getLogger(__name__)


def _get_client() -> genai.Client:
    """Gemini クライアントを取得。Vertex AI優先、フォールバックで直接API。"""
    if settings.google_gemini_project:
        # Vertex AI モード (Application Default Credentials)
        return genai.Client(
            vertexai=True,
            project=settings.google_gemini_project,
            location=settings.google_gemini_location,
        )
    elif settings.google_gemini_api_key:
        # 直接 API キーモード
        return genai.Client(api_key=settings.google_gemini_api_key)
    else:
        raise ValueError(
            "Google Gemini not configured. Set GOOGLE_GEMINI_PROJECT (Vertex AI) "
            "or GOOGLE_GEMINI_API_KEY (Direct API)."
        )


async def generate_slide_image(
    topic: str,
    course_code: str,
    slide_number: int,
    total_slides: int,
    content_points: list[str],
) -> dict:
    """Gemini でビジュアルスライド画像を生成

    Returns:
        {"image_base64": str, "mime_type": str, "text": str}
    """
    client = _get_client()

    prompt = f"""プレゼンテーションスライドを1枚作成してください。

トピック: {topic}
資格: {course_code}
スライド {slide_number}/{total_slides}

内容ポイント:
{chr(10).join(f"- {p}" for p in content_points)}

スライドのデザイン要件:
- プロフェッショナルなデザイン
- ダークテーマ（背景: 暗めのグレーまたはネイビー）
- タイトルとコンテンツを明確に分離
- 箇条書きは見やすいフォントサイズ
- 右上に「{course_code}」バッジ
- スライド番号: {slide_number}/{total_slides}

画像として出力してください。"""

    try:
        # google-genai SDKは同期呼び出しのため、イベントループをブロックしないよう別スレッドで実行する
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.google_gemini_image_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        result: dict = {"text": "", "image_base64": None, "mime_type": None}

        if response.candidates and response.candidates[0].content:
            for part in response.candidates[0].content.parts:
                if part.text:
                    result["text"] = part.text
                elif part.inline_data:
                    result["image_base64"] = base64.b64encode(
                        part.inline_data.data
                    ).decode("utf-8")
                    result["mime_type"] = part.inline_data.mime_type

        return result

    except Exception as e:
        logger.error(f"Gemini slide generation error: {e}")
        raise RuntimeError(f"Geminiスライド生成に失敗しました: {type(e).__name__}") from e


async def generate_text(prompt: str, system: str = "") -> str:
    """Gemini でテキスト生成（フォールバック用）"""
    client = _get_client()

    config = types.GenerateContentConfig()
    if system:
        config = types.GenerateContentConfig(system_instruction=system)

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.google_gemini_model,
            contents=prompt,
            config=config,
        )
        return response.text or ""
    except Exception as e:
        logger.error(f"Gemini text generation error: {e}")
        raise RuntimeError(f"Geminiテキスト生成に失敗しました: {type(e).__name__}") from e


async def stream_generate_text(prompt: str, system: str = ""):
    """Gemini でテキストをストリーミング生成（SSE用）

    google-genai SDKの generate_content_stream は同期イテレータのため、
    そのままasync関数内でforループするとチャンク取得のたびにイベントループを
    ブロックしてしまう。別スレッドで同期イテレーションを行い、asyncio.Queue経由で
    非同期ジェネレータに橋渡しする。
    """
    client = _get_client()

    config = types.GenerateContentConfig()
    if system:
        config = types.GenerateContentConfig(system_instruction=system)

    loop = asyncio.get_event_loop()
    queue: asyncio.Queue = asyncio.Queue()
    sentinel = object()

    def _produce() -> None:
        try:
            response_stream = client.models.generate_content_stream(
                model=settings.google_gemini_model,
                contents=prompt,
                config=config,
            )
            for chunk in response_stream:
                if chunk.text:
                    loop.call_soon_threadsafe(queue.put_nowait, chunk.text)
        except Exception as e:  # noqa: BLE001
            loop.call_soon_threadsafe(queue.put_nowait, e)
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, sentinel)

    loop.run_in_executor(None, _produce)

    while True:
        item = await queue.get()
        if item is sentinel:
            break
        if isinstance(item, Exception):
            logger.error(f"Gemini stream error: {item}")
            raise RuntimeError(f"Geminiストリーミング生成に失敗しました: {type(item).__name__}") from item
        yield item


def is_gemini_available() -> bool:
    """Gemini が利用可能かチェック"""
    return bool(settings.google_gemini_project or settings.google_gemini_api_key)
