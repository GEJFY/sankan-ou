"""AI Tutor endpoints"""

import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel, Field

from src.deps import CurrentUser
from src.llm.client import MODEL_SONNET, stream_generate
from src.llm.prompts.tutor import (
    build_compare_prompt,
    build_explain_prompt,
    build_knowledge_bridge_prompt,
    build_socratic_prompt,
)
from src.schemas.tutor import ChatRequest, CompareRequest, ExplainRequest
from src.services.rate_limit import check_user_rate_limit


class SocraticRequest(BaseModel):
    concept: str
    user_answer: str
    is_correct: bool = False


class BridgeRequest(BaseModel):
    concept: str
    from_course: str = Field(description="CIA/CISA/CFE")
    to_course: str = Field(description="CIA/CISA/CFE")

router = APIRouter(prefix="/ai-tutor", tags=["ai-tutor"])

# 1ユーザーあたり: 1分間に最大12回のLLM生成呼び出し (ストリーミングSSE系エンドポイント共通)
_TUTOR_RATE_LIMIT = 12
_TUTOR_RATE_WINDOW_SECONDS = 60.0


def _throttle(current_user: CurrentUser) -> None:
    check_user_rate_limit("ai-tutor", current_user.id, _TUTOR_RATE_LIMIT, _TUTOR_RATE_WINDOW_SECONDS)


async def sse_wrapper(generator):
    """SSE format wrapper with error handling"""
    try:
        async for chunk in generator:
            yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
    except Exception as e:
        logger.error(f"SSE stream error: {e}")
        error_payload = {"error": "AIの応答生成中にエラーが発生しました。しばらくしてから再度お試しください。"}
        yield f"data: {json.dumps(error_payload, ensure_ascii=False)}\n\n"
    yield "data: [DONE]\n\n"


@router.post("/explain", dependencies=[Depends(_throttle)])
async def explain_concept(body: ExplainRequest, current_user: CurrentUser):
    """概念解説 (SSEストリーミング)"""
    system, user_prompt = build_explain_prompt(
        concept=body.concept,
        level=body.level,
        course_codes=body.course_codes,
    )

    return StreamingResponse(
        sse_wrapper(stream_generate(user_prompt, system=system, model=MODEL_SONNET)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/compare", dependencies=[Depends(_throttle)])
async def compare_concepts(body: CompareRequest, current_user: CurrentUser):
    """3資格比較表生成 (SSEストリーミング)"""
    system, user_prompt = build_compare_prompt(body.concept)

    return StreamingResponse(
        sse_wrapper(stream_generate(user_prompt, system=system, model=MODEL_SONNET)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat", dependencies=[Depends(_throttle)])
async def chat(body: ChatRequest, current_user: CurrentUser):
    """一般Q&A (SSEストリーミング)"""
    from src.llm.prompts.tutor import LEVEL_DESCRIPTIONS, MARKDOWN_INSTRUCTION

    level_desc = LEVEL_DESCRIPTIONS.get(body.level, LEVEL_DESCRIPTIONS[4])
    system = f"""あなたはGRC分野の優秀な教師です。CIA/CISA/CFE資格に精通しています。
以下のレベルで回答してください: {level_desc}
簡潔で正確な回答を心がけてください。
関連するCIA/CISA/CFEのシラバス領域も可能な限り言及してください。
{MARKDOWN_INSTRUCTION}"""

    return StreamingResponse(
        sse_wrapper(stream_generate(body.message, system=system)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/socratic", dependencies=[Depends(_throttle)])
async def socratic_dialogue(body: SocraticRequest, current_user: CurrentUser):
    """ソクラテス式対話 (SSEストリーミング)"""
    system, user_prompt = build_socratic_prompt(
        concept=body.concept,
        user_answer=body.user_answer,
        is_correct=body.is_correct,
    )

    return StreamingResponse(
        sse_wrapper(stream_generate(user_prompt, system=system, model=MODEL_SONNET)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/bridge", dependencies=[Depends(_throttle)])
async def knowledge_bridge(body: BridgeRequest, current_user: CurrentUser):
    """知識ブリッジ - 資格間の概念マッピング (SSEストリーミング)"""
    system, user_prompt = build_knowledge_bridge_prompt(
        concept=body.concept,
        from_course=body.from_course,
        to_course=body.to_course,
    )

    return StreamingResponse(
        sse_wrapper(stream_generate(user_prompt, system=system, model=MODEL_SONNET)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
