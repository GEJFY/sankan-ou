"""Question generation and answer endpoints"""

import json
import uuid

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from src.deps import DbSession
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

router = APIRouter(prefix="/questions", tags=["questions"])

DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.post("/generate", response_model=GenerateQuestionsResponse)
async def generate_questions(body: GenerateQuestionsRequest, db: DbSession):
    """LLMで練習問題を自動生成"""
    # Topic + Course情報を取得
    topic = await db.get(Topic, body.topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="トピックが見つかりません")

    course = await db.get(Course, topic.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="コースが見つかりません")

    # LLMで問題生成
    system, user_prompt = build_question_gen_prompt(
        topic_name=topic.name,
        course_code=course.code,
        count=body.count,
        difficulty=body.difficulty,
    )

    raw_response = await generate(
        user_prompt,
        system=system,
        model=MODEL_SONNET,
        max_tokens=4096,
        temperature=0.8,
    )

    # JSON parse
    try:
        # ```json ... ``` ブロックを除去
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        questions_data = json.loads(cleaned)
    except (json.JSONDecodeError, IndexError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLMからの応答をパースできませんでした: {e}",
        )

    # DBに保存
    questions_out = []
    for q_data in questions_data:
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

    return GenerateQuestionsResponse(questions=questions_out)


@router.post("/answer", response_model=AnswerResponse)
async def answer_question(body: AnswerRequest, db: DbSession):
    """回答送信"""
    question = await db.get(Question, body.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="問題が見つかりません")

    # 正解判定
    correct_index = next(
        (i for i, c in enumerate(question.choices) if c.get("is_correct")),
        0,
    )
    is_correct = body.selected_index == correct_index

    # 回答記録
    attempt = QuestionAttempt(
        user_id=DEMO_USER_ID,
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
