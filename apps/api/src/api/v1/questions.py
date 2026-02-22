"""Question generation and answer endpoints"""

import json
import logging
import re

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select

from src.deps import CurrentUser, DbSession
from src.llm.client import MODEL_SONNET, generate
from src.llm.prompts.question_gen import build_question_gen_prompt
from src.models.course import Course, Topic
from src.models.question import Question, QuestionAttempt
from src.schemas.question import (
    AnswerRequest,
    AnswerResponse,
    ChoiceOut,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    QuestionOut,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/questions", tags=["questions"])


def _extract_json_array(raw: str) -> list:
    """LLM応答から最初の有効なJSON配列を抽出する（ロバスト版）"""
    text = raw.strip()
    # ```json ... ``` ブロック除去
    if "```" in text:
        match = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
        if match:
            text = match.group(1).strip()
    # 最初の [ ... ] をブラケットカウントで抽出
    start = text.find("[")
    if start == -1:
        raise ValueError("JSON配列が見つかりません")
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
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                candidate = text[start : i + 1]
                return json.loads(candidate)
    # フォールバック: そのまま試行
    return json.loads(text)


@router.get("/bank", response_model=GenerateQuestionsResponse)
async def get_question_bank(
    db: DbSession,
    current_user: CurrentUser,
    topic_id: str = Query(..., description="トピックID"),
    count: int = Query(5, ge=1, le=200, description="問題数"),
):
    """DB保存済みの問題をランダムに取得"""
    topic = await db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="トピックが見つかりません")

    course = await db.get(Course, topic.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="コースが見つかりません")

    stmt = (
        select(Question)
        .where(Question.topic_id == topic.id)
        .order_by(func.random())
        .limit(count)
    )
    result = await db.execute(stmt)
    questions = result.scalars().all()

    return GenerateQuestionsResponse(
        questions=[
            QuestionOut(
                id=q.id,
                stem=q.stem,
                choices=[ChoiceOut(**c) for c in q.choices],
                explanation=q.explanation,
                difficulty=q.difficulty,
                course_code=course.code,
            )
            for q in questions
        ]
    )


@router.post("/generate", response_model=GenerateQuestionsResponse)
async def generate_questions(body: GenerateQuestionsRequest, db: DbSession, current_user: CurrentUser):
    """LLMで練習問題を自動生成（大量生成時はバッチ分割）"""
    topic = await db.get(Topic, body.topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="トピックが見つかりません")

    course = await db.get(Course, topic.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="コースが見つかりません")

    # 大量生成時はバッチ分割（LLMの出力制限対策）
    batch_size = 10
    total_needed = body.count
    all_questions_data: list = []

    while len(all_questions_data) < total_needed:
        remaining = total_needed - len(all_questions_data)
        batch_count = min(remaining, batch_size)

        system, user_prompt = build_question_gen_prompt(
            topic_name=topic.name,
            course_code=course.code,
            count=batch_count,
            difficulty=body.difficulty,
        )

        try:
            raw_response = await generate(
                user_prompt,
                system=system,
                model=MODEL_SONNET,
                max_tokens=8192,
                temperature=0.8,
            )
        except Exception as e:
            logger.error(f"LLM question generation failed: {e}")
            if all_questions_data:
                break  # 一部生成済みならそれを返す
            raise HTTPException(
                status_code=502,
                detail=f"問題生成に失敗しました: {e}",
            )

        try:
            batch_data = _extract_json_array(raw_response)
            all_questions_data.extend(batch_data)
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"JSON parse failed for batch: {e}")
            if all_questions_data:
                break
            raise HTTPException(
                status_code=500,
                detail=f"LLMからの応答をパースできませんでした: {e}",
            )

    # DBに保存
    questions_out = []
    for q_data in all_questions_data[:total_needed]:
        try:
            question = Question(
                course_id=course.id,
                topic_id=topic.id,
                stem=q_data["stem"],
                choices=q_data["choices"],
                explanation=q_data.get("explanation", ""),
                difficulty=q_data.get("difficulty", body.difficulty),
                format="multiple_choice",
                source="llm",
            )
            db.add(question)
            await db.flush()

            questions_out.append(
                QuestionOut(
                    id=question.id,
                    stem=question.stem,
                    choices=[ChoiceOut(**c) for c in question.choices],
                    explanation=question.explanation,
                    difficulty=question.difficulty,
                    course_code=course.code,
                )
            )
        except (KeyError, TypeError) as e:
            logger.warning(f"Skipping malformed question data: {e}")
            continue

    return GenerateQuestionsResponse(questions=questions_out)


@router.post("/answer", response_model=AnswerResponse)
async def answer_question(body: AnswerRequest, db: DbSession, current_user: CurrentUser):
    """回答送信"""
    question = await db.get(Question, body.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="問題が見つかりません")

    correct_index = next(
        (i for i, c in enumerate(question.choices) if c.get("is_correct")),
        0,
    )
    is_correct = body.selected_index == correct_index

    attempt = QuestionAttempt(
        user_id=current_user.id,
        question_id=question.id,
        selected_index=body.selected_index,
        is_correct=is_correct,
        response_time_ms=body.response_time_ms,
    )
    db.add(attempt)

    return AnswerResponse(
        is_correct=is_correct,
        correct_index=correct_index,
        explanation=question.explanation,
    )
