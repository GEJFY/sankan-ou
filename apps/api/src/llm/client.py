"""Anthropic Claude API client wrapper"""

from collections.abc import AsyncIterator

import anthropic
from loguru import logger

from src.config import settings

# Model routing
MODEL_SONNET = "claude-sonnet-4-5-20250929"
MODEL_HAIKU = "claude-haiku-4-5-20251001"


def get_client() -> anthropic.AsyncAnthropic:
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


async def generate(
    prompt: str,
    system: str = "",
    model: str = MODEL_HAIKU,
    max_tokens: int = 2048,
    temperature: float = 0.7,
) -> str:
    """Non-streaming completion"""
    client = get_client()
    messages = [{"role": "user", "content": prompt}]

    response = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
        temperature=temperature,
    )

    return response.content[0].text


async def stream_generate(
    prompt: str,
    system: str = "",
    model: str = MODEL_HAIKU,
    max_tokens: int = 2048,
    temperature: float = 0.7,
) -> AsyncIterator[str]:
    """Streaming completion (SSE用)"""
    client = get_client()
    messages = [{"role": "user", "content": prompt}]

    async with client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
        temperature=temperature,
    ) as stream:
        async for text in stream.text_stream:
            yield text
