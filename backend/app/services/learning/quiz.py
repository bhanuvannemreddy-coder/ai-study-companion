import json
import random
import re
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.quiz_answer import QuizAnswer
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz_question import QuizQuestion
from app.schemas.quiz import GeneratedQuiz
from app.services.ai.provider import (
    AIProviderError,
    get_ai_provider,
)
from app.services.learning.context import get_tutor_context
from app.services.rag.retriever import retrieve_chunks


MAX_GENERATION_ATTEMPTS = 3


QUESTION_FOCUSES = [
    "conceptual understanding",
    "formula and condition recall",
    "application of a formula",
    "theorem interpretation",
    "comparison between related concepts",
    "reasoning from a geometric setup",
    "identifying the correct method",
    "short calculation or substitution",
    "common conceptual misunderstanding",
]


def clean_json_response(text: str) -> str:
    text = text.strip()

    if text.startswith("```"):
        text = re.sub(
            r"^```(?:json)?\s*",
            "",
            text,
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"\s*```$",
            "",
            text,
        )

    return text.strip()


def normalize_question(text: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        text.strip().lower(),
    )


def build_quiz_context(
    chunks: list[dict],
) -> str:
    parts = []

    for index, chunk in enumerate(
        chunks,
        start=1,
    ):
        parts.append(
            f"""
Evidence {index}
Source: {chunk["source"]}
Page: {chunk["page_number"]}

{chunk["content"]}
""".strip()
        )

    return "\n\n---\n\n".join(parts)


def get_question_history(
    db: Session,
    project_id: int,
    limit: int = 30,
) -> list[dict]:
    rows = (
        db.query(
            QuizQuestion.question_text,
            QuizQuestion.concept,
            QuizQuestion.difficulty,
            QuizAnswer.score,
            QuizAnswer.is_correct,
        )
        .join(
            QuizAttempt,
            QuizQuestion.attempt_id
            == QuizAttempt.id,
        )
        .outerjoin(
            QuizAnswer,
            (
                QuizAnswer.question_id
                == QuizQuestion.id
            )
            & (
                QuizAnswer.attempt_id
                == QuizAttempt.id
            ),
        )
        .filter(
            QuizAttempt.project_id == project_id,
        )
        .order_by(
            QuizAttempt.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    history = []

    for row in rows:
        history.append(
            {
                "question_text": row.question_text,
                "concept": row.concept,
                "difficulty": row.difficulty,
                "score": row.score,
                "is_correct": row.is_correct,
            }
        )

    return history


def build_question_history(
    history: list[dict],
) -> str:
    if not history:
        return (
            "No previous quiz questions exist "
            "for this project."
        )

    parts = []

    for index, item in enumerate(
        history,
        start=1,
    ):
        performance = "not answered"

        if item["score"] is not None:
            performance = (
                f"score={item['score']}"
            )

        parts.append(
            f"""
Previous question {index}
Question: {item["question_text"]}
Concept: {item["concept"] or "unknown"}
Difficulty: {item["difficulty"] or "unknown"}
Performance: {performance}
""".strip()
        )

    return "\n\n".join(parts)


def build_learning_context(
    learning_context,
) -> str:
    if not learning_context:
        return (
            "No persistent learning context "
            "is available yet."
        )

    parts = []

    if learning_context.tutor_context:
        parts.append(
            "General learner context:\n"
            + learning_context.tutor_context
        )

    if learning_context.strengths:
        parts.append(
            "Known strengths:\n"
            + "\n".join(
                f"- {item}"
                for item in learning_context.strengths
            )
        )

    if learning_context.weaknesses:
        parts.append(
            "Areas needing attention:\n"
            + "\n".join(
                f"- {item}"
                for item in learning_context.weaknesses
            )
        )

    if learning_context.repeated_mistakes:
        parts.append(
            "Repeated mistakes:\n"
            + "\n".join(
                f"- {item}"
                for item in learning_context.repeated_mistakes
            )
        )

    if learning_context.assessment_summary:
        parts.append(
            "Assessment summary:\n"
            + str(
                learning_context.assessment_summary
            )
        )

    if not parts:
        return (
            "No persistent learning context "
            "is available yet."
        )

    return "\n\n".join(parts)


def validate_generated_quiz(
    payload: dict,
    question_count: int,
    previous_questions: set[str],
) -> GeneratedQuiz:

    try:
        generated_quiz = GeneratedQuiz.model_validate(
            payload
        )
    except Exception as exc:
        raise AIProviderError(
            f"Quiz generator returned an invalid "
            f"quiz structure: {exc}"
        ) from exc

    if len(generated_quiz.questions) != question_count:
        raise AIProviderError(
            f"Quiz generator returned "
            f"{len(generated_quiz.questions)} questions; "
            f"expected {question_count}."
        )

    current_questions = set()

    for question in generated_quiz.questions:

        normalized = normalize_question(
            question.question_text
        )

        if normalized in current_questions:
            raise AIProviderError(
                "Quiz generator returned duplicate "
                "questions in the same quiz."
            )

        if normalized in previous_questions:
            raise AIProviderError(
                "Quiz generator repeated a question "
                "from quiz history."
            )

        current_questions.add(normalized)

        if question.question_type == "mcq":

            if not question.options:
                raise AIProviderError(
                    "An MCQ is missing its options."
                )

            if len(question.options) != 4:
                raise AIProviderError(
                    "Every MCQ must contain exactly "
                    "four options."
                )

            if question.correct_option_index not in {
                0,
                1,
                2,
                3,
            }:
                raise AIProviderError(
                    "An MCQ has an invalid correct "
                    "option index."
                )

        elif question.question_type == "open_ended":

            if not question.expected_answer:
                raise AIProviderError(
                    "The open-ended question is missing "
                    "its expected answer."
                )

    return generated_quiz


def generate_quiz(
    db: Session,
    project_id: int,
    user_id: int,
    question_count: int,
) -> QuizAttempt:

    all_chunks = retrieve_chunks(
        db=db,
        project_id=project_id,
        query=(
            "important concepts definitions formulas "
            "conditions theorems examples and key ideas "
            "from this learning material"
        ),
        top_k=10,
    )

    if not all_chunks:
        raise ValueError(
            "No searchable learning material is available "
            "for this project."
        )

    history = get_question_history(
        db=db,
        project_id=project_id,
        limit=30,
    )

    previous_questions = {
        normalize_question(
            item["question_text"]
        )
        for item in history
    }

    learning_context = get_tutor_context(
        db=db,
        user_id=user_id,
        project_id=project_id,
    )

    learning_context_text = build_learning_context(
        learning_context
    )

    variation_focus = random.choice(
        QUESTION_FOCUSES
    )

    chunks = all_chunks.copy()
    random.shuffle(chunks)

    context = build_quiz_context(chunks)

    history_context = build_question_history(
        history
    )

    mcq_count = max(
        2,
        question_count - 1,
    )

    open_ended_count = 1

    system_prompt = f"""
You are an assessment generator for an AI Study Companion.

Generate exactly {question_count} questions using ONLY
the project evidence provided below.

Question distribution:
- {mcq_count} multiple-choice questions
- {open_ended_count} open-ended question

Current variation focus:
{variation_focus}

Rules:

1. Every question must be answerable from the supplied
   project evidence.
2. Do not use outside knowledge.
3. Do not invent formulas, facts, definitions, or conditions.
4. Do not repeat any previous question listed below.
5. Do not produce two questions testing exactly the same
   wording or idea.
6. Prefer different concepts across the quiz when the
   material provides enough concepts.
7. Change the framing and reasoning approach from previous
   quizzes.
8. Include some questions that test understanding rather
   than simple memorization.
9. MCQs must have exactly 4 options.
10. For MCQs, correct_option_index must be 0, 1, 2, or 3.
11. For open-ended questions, provide an expected_answer.
12. Include a concise explanation for every question.
13. Assign a concept and difficulty to every question.
14. Use learner context only to decide where additional
    practice may be useful.
15. Never treat learner context as factual evidence about
    the project material.
16. Return ONLY valid JSON.
17. Do not use markdown fences.
18. Do not include any text before or after the JSON.

Required JSON structure:

{{
  "questions": [
    {{
      "question_type": "mcq",
      "question_text": "...",
      "options": ["...", "...", "...", "..."],
      "correct_option_index": 0,
      "expected_answer": null,
      "explanation": "...",
      "concept": "...",
      "difficulty": "medium"
    }},
    {{
      "question_type": "open_ended",
      "question_text": "...",
      "options": null,
      "correct_option_index": null,
      "expected_answer": "...",
      "explanation": "...",
      "concept": "...",
      "difficulty": "medium"
    }}
  ]
}}

Persistent learner context:

{learning_context_text}

Previous quiz history:

{history_context}

Project evidence:

{context}
"""

    provider = get_ai_provider()

    last_error = None
    generated_quiz = None

    for attempt_number in range(
        1,
        MAX_GENERATION_ATTEMPTS + 1,
    ):
        try:
            raw_response = provider.generate(
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": (
                            "Generate a fresh quiz. "
                            "Avoid every question in the "
                            "history and vary the concepts "
                            "and question framing."
                        ),
                    },
                ],
                temperature=0.55,
                db=db,
                user_id=user_id,
                project_id=project_id,
                feature="quiz_generation",
            )

            cleaned_response = clean_json_response(
                raw_response
            )

            payload = json.loads(
                cleaned_response
            )

            generated_quiz = validate_generated_quiz(
                payload,
                question_count,
                previous_questions,
            )

            break

        except json.JSONDecodeError:
            last_error = (
                "AI provider returned invalid JSON."
            )

        except AIProviderError as exc:
            last_error = str(exc)

        except Exception as exc:
            last_error = (
                f"Unexpected quiz generation error: {exc}"
            )

        if attempt_number == MAX_GENERATION_ATTEMPTS:
            raise AIProviderError(
                f"Quiz generation failed after "
                f"{MAX_GENERATION_ATTEMPTS} attempts. "
                f"Last error: {last_error}"
            )

        variation_focus = random.choice(
            QUESTION_FOCUSES
        )

    if generated_quiz is None:
        raise AIProviderError(
            "Quiz generator did not return a valid quiz."
        )

    attempt = QuizAttempt(
        project_id=project_id,
        user_id=user_id,
        question_count=question_count,
        status="in_progress",
    )

    db.add(attempt)
    db.flush()

    for index, question in enumerate(
        generated_quiz.questions,
        start=1,
    ):
        db.add(
            QuizQuestion(
                attempt_id=attempt.id,
                question_order=index,
                question_type=question.question_type,
                question_text=question.question_text,
                options=question.options,
                correct_option_index=(
                    question.correct_option_index
                ),
                expected_answer=(
                    question.expected_answer
                ),
                explanation=question.explanation,
                concept=question.concept,
                difficulty=question.difficulty,
            )
        )

    db.commit()
    db.refresh(attempt)

    return attempt


def evaluate_answer(
    db: Session,
    attempt: QuizAttempt,
    question: QuizQuestion,
    answer_text: str,
):
    if question.question_type == "mcq":

        try:
            selected_index = int(
                answer_text.strip()
            )
        except ValueError:
            selected_index = -1

        is_correct = (
            selected_index
            == question.correct_option_index
        )

        score = 1.0 if is_correct else 0.0

        if is_correct:
            feedback = (
                f"Correct. "
                f"{question.explanation}"
            )
        else:
            feedback = (
                f"Not quite. "
                f"{question.explanation}"
            )

    else:
        context = retrieve_chunks(
            db=db,
            project_id=attempt.project_id,
            query=question.question_text,
            top_k=5,
        )

        evidence = build_quiz_context(
            context
        )

        provider = get_ai_provider()

        evaluation_prompt = f"""
Evaluate the student's answer using ONLY the supplied
project evidence and expected answer.

Question:
{question.question_text}

Expected answer:
{question.expected_answer}

Student answer:
{answer_text}

Project evidence:
{evidence}

Return ONLY valid JSON:

{{
  "is_correct": true,
  "score": 0.0,
  "feedback": "..."
}}

Rules:
- score must be between 0.0 and 1.0
- give partial credit when the student demonstrates
  meaningful understanding
- feedback must identify what was understood and what
  is missing
- do not use outside knowledge
"""

        raw_response = provider.generate(
            messages=[
                {
                    "role": "system",
                    "content": evaluation_prompt,
                },
                {
                    "role": "user",
                    "content": (
                        "Evaluate this student answer."
                    ),
                },
            ],
            temperature=0.1,
            db=db,
            user_id=attempt.user_id,
            project_id=attempt.project_id,
            feature="open_ended_evaluation",
        )

        cleaned_response = clean_json_response(
            raw_response
        )

        try:
            result = json.loads(
                cleaned_response
            )
        except json.JSONDecodeError as exc:
            raise AIProviderError(
                "Open-ended evaluator returned "
                "invalid JSON."
            ) from exc

        is_correct = bool(
            result.get(
                "is_correct",
                False,
            )
        )

        score = float(
            result.get(
                "score",
                0.0,
            )
        )

        score = max(
            0.0,
            min(1.0, score),
        )

        feedback = str(
            result.get(
                "feedback",
                "Answer evaluated.",
            )
        )

    existing_answer = (
        db.query(QuizAnswer)
        .filter(
            QuizAnswer.attempt_id == attempt.id,
            QuizAnswer.question_id == question.id,
        )
        .first()
    )

    if existing_answer:
        answer = existing_answer
        answer.answer_text = answer_text
        answer.is_correct = is_correct
        answer.score = score
        answer.feedback = feedback
    else:
        answer = QuizAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            answer_text=answer_text,
            is_correct=is_correct,
            score=score,
            feedback=feedback,
        )

        db.add(answer)

    db.commit()
    db.refresh(answer)

    return answer


def complete_quiz(
    db: Session,
    attempt: QuizAttempt,
):
    answers = (
        db.query(QuizAnswer)
        .filter(
            QuizAnswer.attempt_id
            == attempt.id
        )
        .all()
    )

    if not answers:
        raise ValueError(
            "No answers have been submitted."
        )

    answered_questions = len(answers)

    total_score = sum(
        answer.score or 0.0
        for answer in answers
    )

    total_questions = attempt.question_count

    score_percent = (
        total_score
        / total_questions
        * 100
    )

    attempt.status = "completed"
    attempt.score_percent = round(
        score_percent,
        2,
    )
    attempt.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(attempt)

    return {
        "answered_questions": answered_questions,
        "total_questions": total_questions,
        "score_percent": attempt.score_percent,
    }