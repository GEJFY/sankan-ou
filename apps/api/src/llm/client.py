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


async def _openai_generate(
    messages: list[dict], model: str, max_tokens: int, temperature: float,
) -> str:
    client = _get_openai_client()
    response = await client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=messages,
        temperature=temperature,
    )
    return response.choices[0].message.content or ""


async def _openai_stream(
    messages: list[dict], model: str, max_tokens: int, temperature: float,
) -> AsyncIterator[str]:
    client = _get_openai_client()
    stream = await client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=messages,
        temperature=temperature,
        stream=True,
    )
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
async def generate(
    prompt: str,
    system: str = "",
    model: str | None = None,
    max_tokens: int = 2048,
    temperature: float = 0.7,
) -> str:
    """Non-streaming completion (プロバイダー自動判定)"""
    model = model or MODEL_CHAT

    if _is_claude(model):
        return await _anthropic_generate(system, prompt, model, max_tokens, temperature)

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    return await _openai_generate(messages, model, max_tokens, temperature)


async def stream_generate(
    prompt: str,
    system: str = "",
    model: str | None = None,
    max_tokens: int = 2048,
    temperature: float = 0.7,
) -> AsyncIterator[str]:
    """Streaming completion - SSE用 (プロバイダー自動判定)"""
    model = model or MODEL_CHAT

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
