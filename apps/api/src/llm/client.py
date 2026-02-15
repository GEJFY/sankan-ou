"""Azure OpenAI API client wrapper"""

from collections.abc import AsyncIterator

from openai import AsyncAzureOpenAI
from loguru import logger

from src.config import settings

# Model routing (Azure OpenAI deployment names)
MODEL_SONNET = "gpt-4-1-mini"   # 解説生成・問題生成用
MODEL_HAIKU = "gpt-4-1-nano"    # チャット・軽量処理用


def get_client() -> AsyncAzureOpenAI:
    return AsyncAzureOpenAI(
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        api_version=settings.azure_openai_api_version,
    )


async def generate(
    prompt: str,
    system: str = "",
    model: str = MODEL_HAIKU,
    max_tokens: int = 2048,
    temperature: float = 0.7,
) -> str:
    """Non-streaming completion"""
    client = get_client()
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=messages,
        temperature=temperature,
    )

    return response.choices[0].message.content or ""


async def stream_generate(
    prompt: str,
    system: str = "",
    model: str = MODEL_HAIKU,
    max_tokens: int = 2048,
    temperature: float = 0.7,
) -> AsyncIterator[str]:
    """Streaming completion (SSE用)"""
    client = get_client()
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

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
