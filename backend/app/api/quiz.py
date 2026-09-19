from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.project import Project
from app.models.quiz_answer import QuizAnswer
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz_question import QuizQuestion
from app.models.space import Space
from app.models.user import User

from app.schemas.quiz import (
    QuizAnswerResponse,
    QuizCompleteResponse,
    QuizGenerateResponse,
    QuizQuestionResponse,
)

from app.services.analytics.events import record_event
from app.services.learning.context import refresh_learning_context
from app.services.learning.mastery import update_mastery_for_attempt
from app.services.learning.quiz import (
    complete_quiz,
    evaluate_answer,
    generate_quiz,
)


router = APIRouter(
    prefix="/api",
    tags=["Quiz"],
)


# ==========================================================
# OWNERSHIP HELPERS
# ==========================================================


def get_owned_project(
    db: Session,
    project_id: int,
    user_id: int,
) -> Project:

    project = (
        db.query(Project)
        .join(
            Space,
            Project.space_id == Space.id,
        )
        .filter(
            Project.id == project_id,
            Space.user_id == user_id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    return project


def get_owned_attempt(
    db: Session,
    attempt_id: int,
    project_id: int,
    user_id: int,
) -> QuizAttempt:

    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.project_id == project_id,
            QuizAttempt.user_id == user_id,
        )
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Quiz attempt not found.",
        )

    return attempt


# ==========================================================
# QUESTION SERIALIZATION
# ==========================================================


def serialize_question(
    question: QuizQuestion,
) -> QuizQuestionResponse:

    return QuizQuestionResponse(
        id=question.id,
        question_order=question.question_order,
        question_type=question.question_type,
        question_text=question.question_text,
        options=question.options,
        concept=question.concept,
        difficulty=question.difficulty,
    )


# ==========================================================
# START QUIZ
# ==========================================================


@router.post(
    "/projects/{project_id}/quiz",
    response_model=QuizGenerateResponse,
)
def start_quiz(
    project_id: int,
    question_count: int = Query(
        default=5,
        ge=3,
        le=10,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Start a new adaptive quiz for a project.
    """

    get_owned_project(
        db=db,
        project_id=project_id,
        user_id=current_user.id,
    )

    try:

        attempt = generate_quiz(
            db=db,
            project_id=project_id,
            user_id=current_user.id,
            question_count=question_count,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Quiz generation failed: {exc}",
        ) from exc

    record_event(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        event_type="quiz_started",
        title="Quiz started",
        description=(
            f"A {question_count}-question quiz was started."
        ),
        event_metadata={
            "attempt_id": attempt.id,
            "question_count": question_count,
        },
    )

    db.commit()
    db.refresh(attempt)

    questions = (
        db.query(QuizQuestion)
        .filter(
            QuizQuestion.attempt_id == attempt.id,
        )
        .order_by(
            QuizQuestion.question_order.asc(),
        )
        .all()
    )

    return QuizGenerateResponse(
        attempt_id=attempt.id,
        project_id=attempt.project_id,
        questions=[
            serialize_question(question)
            for question in questions
        ],
    )


# ==========================================================
# GET EXISTING QUIZ
# ==========================================================


@router.get(
    "/projects/{project_id}/quiz/{attempt_id}",
)
def get_quiz(
    project_id: int,
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get an existing quiz attempt and its questions.
    """

    attempt = get_owned_attempt(
        db=db,
        attempt_id=attempt_id,
        project_id=project_id,
        user_id=current_user.id,
    )

    questions = (
        db.query(QuizQuestion)
        .filter(
            QuizQuestion.attempt_id == attempt.id,
        )
        .order_by(
            QuizQuestion.question_order.asc(),
        )
        .all()
    )

    return {
        "attempt_id": attempt.id,
        "project_id": attempt.project_id,
        "question_count": attempt.question_count,
        "status": attempt.status,
        "score_percent": attempt.score_percent,
        "created_at": (
            attempt.created_at.isoformat()
            if attempt.created_at
            else None
        ),
        "completed_at": (
            attempt.completed_at.isoformat()
            if attempt.completed_at
            else None
        ),
        "questions": [
            serialize_question(question).model_dump()
            for question in questions
        ],
    }


# ==========================================================
# SUBMIT ANSWER
# ==========================================================


@router.post(
    "/projects/{project_id}/quiz/{attempt_id}/questions/{question_id}/answer",
    response_model=QuizAnswerResponse,
)
def submit_answer(
    project_id: int,
    attempt_id: int,
    question_id: int,
    answer_text: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit an answer for one quiz question.
    """

    attempt = get_owned_attempt(
        db=db,
        attempt_id=attempt_id,
        project_id=project_id,
        user_id=current_user.id,
    )

    if attempt.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="This quiz has already been completed.",
        )

    question = (
        db.query(QuizQuestion)
        .filter(
            QuizQuestion.id == question_id,
            QuizQuestion.attempt_id == attempt.id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Quiz question not found.",
        )

    if not answer_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty.",
        )

    try:

        answer = evaluate_answer(
            db=db,
            attempt=attempt,
            question=question,
            answer_text=answer_text.strip(),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Answer evaluation failed: {exc}",
        ) from exc

    record_event(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        event_type="question_answered",
        title="Question answered",
        description=(
            f"Answered question {question.question_order} "
            f"in the current quiz."
        ),
        event_metadata={
            "attempt_id": attempt.id,
            "question_id": question.id,
            "question_order": question.question_order,
            "concept": question.concept,
            "difficulty": question.difficulty,
            "score": answer.score,
            "is_correct": answer.is_correct,
        },
    )

    db.commit()
    db.refresh(answer)

    return QuizAnswerResponse(
        question_id=answer.question_id,
        is_correct=bool(answer.is_correct),
        score=float(answer.score or 0.0),
        feedback=answer.feedback or "",
    )


# ==========================================================
# COMPLETE QUIZ
# ==========================================================


@router.post(
    "/projects/{project_id}/quiz/{attempt_id}/complete",
    response_model=QuizCompleteResponse,
)
def finish_quiz(
    project_id: int,
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Complete a quiz, update mastery,
    and refresh persistent learning context.
    """

    attempt = get_owned_attempt(
        db=db,
        attempt_id=attempt_id,
        project_id=project_id,
        user_id=current_user.id,
    )

    # --------------------------------------------------
    # Already completed
    # --------------------------------------------------

    if attempt.status == "completed":

        answered_questions = (
            db.query(QuizAnswer)
            .filter(
                QuizAnswer.attempt_id == attempt.id,
            )
            .count()
        )

        return QuizCompleteResponse(
            attempt_id=attempt.id,
            status=attempt.status,
            answered_questions=answered_questions,
            total_questions=attempt.question_count,
            score_percent=float(
                attempt.score_percent or 0.0
            ),
        )

    # --------------------------------------------------
    # Validate all answers submitted
    # --------------------------------------------------

    answered_questions = (
        db.query(QuizAnswer)
        .filter(
            QuizAnswer.attempt_id == attempt.id,
        )
        .count()
    )

    if answered_questions == 0:

        raise HTTPException(
            status_code=400,
            detail="No answers have been submitted.",
        )

    if answered_questions < attempt.question_count:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Please answer all questions before completing "
                f"the quiz. Answered {answered_questions} of "
                f"{attempt.question_count}."
            ),
        )

    # --------------------------------------------------
    # Complete + mastery + context
    # --------------------------------------------------

    try:

        result = complete_quiz(
            db=db,
            attempt=attempt,
        )

        update_mastery_for_attempt(
            db=db,
            attempt=attempt,
        )

        refresh_learning_context(
            db=db,
            user_id=current_user.id,
            project_id=project_id,
        )

    except ValueError as exc:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Quiz completion failed: {exc}",
        ) from exc

    # --------------------------------------------------
    # Activity events
    # --------------------------------------------------

    record_event(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        event_type="quiz_completed",
        title="Quiz completed",
        description=(
            f"Completed the quiz with a score of "
            f"{attempt.score_percent}%."
        ),
        event_metadata={
            "attempt_id": attempt.id,
            "score_percent": attempt.score_percent,
            "question_count": attempt.question_count,
        },
    )

    record_event(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        event_type="mastery_updated",
        title="Mastery updated",
        description=(
            "Concept mastery was updated using the "
            "completed assessment."
        ),
        event_metadata={
            "attempt_id": attempt.id,
            "score_percent": attempt.score_percent,
        },
    )

    record_event(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        event_type="learning_context_updated",
        title="Learning context updated",
        description=(
            "Strengths, weaknesses, repeated mistakes, "
            "and assessment patterns were refreshed."
        ),
        event_metadata={
            "attempt_id": attempt.id,
        },
    )

    db.commit()
    db.refresh(attempt)

    return QuizCompleteResponse(
        attempt_id=attempt.id,
        status=attempt.status,
        answered_questions=result["answered_questions"],
        total_questions=result["total_questions"],
        score_percent=float(
            result["score_percent"] or 0.0
        ),
    )