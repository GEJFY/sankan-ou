"""Azure AI Foundry LLM client - マルチプロバイダー対応

GPT-5系 (GPT-5.2, GPT-5-mini, GPT-5-nano) と Anthropic系 (Claude Opus 4.6, Haiku 4.5) を
Azure AI Foundry の統一エンドポイント経由で利用する。
モデル名のプレフィックスで自動ルーティング。
"""

from collections.abc import AsyncIterator

from loguru import logger

from src.config import settings

# ============================================
# 利用可能モデル定義
# ============================================
# OpenAI系 (Azure AI Foundry)
GPT_52_CHAT = "gpt-5.2-chat"       # フラグシップ / 400K ctx (Preview)
GPT_5_MINI = "gpt-5-mini"          # コスパ生成 / 1M ctx (GA)
GPT_5_NANO = "gpt-5-nano"          # 超低コスト / 1M ctx (GA)

# Anthropic系 (Azure AI Foundry - Enterprise/MCA-Eサブスクリプション要)
CLAUDE_OPUS_46 = "claude-opus-4-6"     # 最高品質 1M ctx (Preview)
CLAUDE_HAIKU_45 = "claude-haiku-4-5"   # 高速 200K ctx (Preview)

# デフォルトモデル (環境変数で上書き可能)
MODEL_GENERATION = settings.llm_model_generation  # 解説生成・問題生成
MODEL_CHAT = settings.llm_model_chat               # チャット・軽量処理

# 後方互換エイリアス（既存コードが参照）
MODEL_SONNET = MODEL_GENERATION
MODEL_HAIKU = MODEL_CHAT


def _is_claude(model: str) -> bool:
    """Claude系モデルかどうか判定"""
    return model.startswith("claude-")


# ============================================
# OpenAI系クライアント (GPT-5 via Azure AI Foundry)
# ============================================
def _get_openai_client():
    from openai import AsyncAzureOpenAI
    return AsyncAzureOpenAI(
        azure_endpoint=settings.azure_foundry_endpoint,
        api_key=settings.azure_foundry_api_key,
        api_version=settings.azure_foundry_api_version,
    )


def _is_reasoning_model(model: str) -> bool:
    """GPT-5系はreasoning model: temperature=1固定、max_completion_tokens必須"""
    return model.startswith("gpt-5")


async def _openai_generate(
    messages: list[dict], model: str, max_tokens: int, temperature: float,
) -> str:
    client = _get_openai_client()
    kwargs: dict = {
        "model": model,
        "max_completion_tokens": max_tokens,
        "messages": messages,
    }
    # GPT-5系はtemperature=1のみサポート（reasoning model）
    if not _is_reasoning_model(model):
        kwargs["temperature"] = temperature
    response = await client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


async def _openai_stream(
    messages: list[dict], model: str, max_tokens: int, temperature: float,
) -> AsyncIterator[str]:
    client = _get_openai_client()
    kwargs: dict = {
        "model": model,
        "max_completion_tokens": max_tokens,
        "messages": messages,
        "stream": True,
    }
    if not _is_reasoning_model(model):
        kwargs["temperature"] = temperature
    stream = await client.chat.completions.create(**kwargs)
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


# ============================================
# Anthropic系クライアント (Claude via Azure AI Foundry)
# AnthropicFoundry SDK を使用 (Enterprise/MCA-Eサブスクリプション要)
# ============================================
def _get_anthropic_client():
    from anthropic import AnthropicFoundry
    return AnthropicFoundry(
        api_key=settings.azure_foundry_api_key,
        base_url=f"{settings.azure_foundry_endpoint.rstrip('/')}/anthropic",
    )


async def _anthropic_generate(
    system: str, prompt: str, model: str, max_tokens: int, temperature: float,
) -> str:
    client = _get_anthropic_client()
    response = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system or "You are a helpful assistant.",
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
    )
    return response.content[0].text


async def _anthropic_stream(
    system: str, prompt: str, model: str, max_tokens: int, temperature: float,
) -> AsyncIterator[str]:
    client = _get_anthropic_client()
    async with client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        system=system or "You are a helpful assistant.",
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
    ) as stream:
        async for text in stream.text_stream:
            yield text


# ============================================
# 統一インターフェース
# ============================================
def _azure_available() -> bool:
    """Azure AI Foundry の資格情報が設定されているか"""
    return bool(settings.azure_foundry_endpoint and settings.azure_foundry_api_key)


def _validate_credentials() -> None:
    """LLM資格情報が設定されているか検証（Azure or Gemini）"""
    from src.llm.gemini_client import is_gemini_available

    if not _azure_available() and not is_gemini_available():
        raise ValueError(
            "LLM credentials not configured. "
            "Set AZURE_FOUNDRY_ENDPOINT/AZURE_FOUNDRY_API_KEY or "
            "GOOGLE_GEMINI_PROJECT/GOOGLE_GEMINI_API_KEY."
        )


async def generate(
    prompt: str,
    system: str = "",
    model: str | None = None,
    max_tokens: int = 16384,
    temperature: float = 0.7,
) -> str:
    """Non-streaming completion (Azure優先、Geminiフォールバック)

    Note: GPT-5系はreasoning tokensを使うため、max_tokensは十分大きく設定する必要がある。
    """
    model = model or MODEL_CHAT
    _validate_credentials()
    logger.info(f"generate: model={model}, max_tokens={max_tokens}")

    # Azure AI Foundry が利用可能なら優先
    if _azure_available():
        try:
            if _is_claude(model):
                return await _anthropic_generate(system, prompt, model, max_tokens, temperature)

            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            return await _openai_generate(messages, model, max_tokens, temperature)
        except ValueError:
            raise
        except Exception as e:
            logger.warning(f"Azure LLM failed (model={model}): {e}, trying Gemini fallback")

    # Gemini フォールバック
    from src.llm.gemini_client import generate_text, is_gemini_available

    if is_gemini_available():
        logger.info("Using Gemini fallback for text generation")
        return await generate_text(prompt, system=system)

    raise RuntimeError("全てのLLMプロバイダーが利用できません")


async def stream_generate(
    prompt: str,
    system: str = "",
    model: str | None = None,
    max_tokens: int = 16384,
    temperature: float = 0.7,
) -> AsyncIterator[str]:
    """Streaming completion - SSE用 (Azure優先、Geminiフォールバック)

    Note: GPT-5系はreasoning tokensを使うため、max_tokensは十分大きく設定する必要がある。
    """
    model = model or MODEL_CHAT
    _validate_credentials()
    logger.info(f"stream_generate: model={model}, max_tokens={max_tokens}")

    # Azure AI Foundry が利用可能なら優先
    if _azure_available():
        try:
            if _is_claude(model):
                async for text in _anthropic_stream(system, prompt, model, max_tokens, temperature):
                    yield text
                return

            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            async for text in _openai_stream(messages, model, max_tokens, temperature):
                yield text
            return
        except ValueError:
            raise
        except Exception as e:
            logger.warning(f"Azure LLM stream failed (model={model}): {e}, trying Gemini fallback")

    # Gemini フォールバック
    from src.llm.gemini_client import stream_generate_text, is_gemini_available

    if is_gemini_available():
        logger.info("Using Gemini fallback for streaming")
        async for text in stream_generate_text(prompt, system=system):
            yield text
        return

    raise RuntimeError("全てのLLMプロバイダーが利用できません")
