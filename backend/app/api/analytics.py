from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.document_chunk import DocumentChunk
from app.models.material import Material
from app.models.project import Project
from app.models.quiz_answer import QuizAnswer
from app.models.quiz_attempt import QuizAttempt
from app.models.space import Space
from app.models.user import User
from app.schemas.analytics import (
    ActivityItem,
    AnalyticsSummary,
    ConceptTrendItem,
    ProjectAnalyticsResponse,
    QuizPerformanceItem,
)
from app.services.learning.mastery import (
    get_project_mastery,
)


router = APIRouter(
    prefix="/api",
    tags=["Analytics"],
)


def get_owned_project(
    project_id: int,
    user_id: int,
    db: Session,
):
    return (
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


@router.get(
    "/projects/{project_id}/analytics",
    response_model=ProjectAnalyticsResponse,
)
def get_project_analytics(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_owned_project(
        project_id,
        current_user.id,
        db,
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    materials = (
        db.query(Material)
        .filter(
            Material.project_id == project_id
        )
        .all()
    )

    total_materials = len(materials)

    ready_materials = sum(
        1
        for material in materials
        if material.status == "ready"
    )

    quiz_attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.project_id == project_id,
            QuizAttempt.user_id == current_user.id,
        )
        .order_by(
            QuizAttempt.created_at.desc()
        )
        .all()
    )

    completed_attempts = [
        attempt
        for attempt in quiz_attempts
        if attempt.status == "completed"
    ]

    scores = [
        attempt.score_percent
        for attempt in completed_attempts
        if attempt.score_percent is not None
    ]

    average_quiz_score = round(
        sum(scores) / len(scores),
        2,
    ) if scores else 0.0

    questions_answered = (
        db.query(QuizAnswer)
        .join(
            QuizAttempt,
            QuizAnswer.attempt_id
            == QuizAttempt.id,
        )
        .filter(
            QuizAttempt.project_id == project_id,
            QuizAttempt.user_id == current_user.id,
        )
        .count()
    )

    mastery_records = get_project_mastery(
        db,
        project_id,
    )

    overall_mastery = round(
        sum(
            item.mastery_score
            for item in mastery_records
        )
        / len(mastery_records),
        2,
    ) if mastery_records else 0.0

    improving_count = sum(
        1
        for item in mastery_records
        if item.trend == "improving"
    )

    attention_count = sum(
        1
        for item in mastery_records
        if item.trend == "needs_attention"
    )

    summary = AnalyticsSummary(
        materials_total=total_materials,
        materials_ready=ready_materials,
        quiz_attempts=len(quiz_attempts),
        completed_quizzes=len(
            completed_attempts
        ),
        questions_answered=questions_answered,
        average_quiz_score=average_quiz_score,
        overall_mastery=overall_mastery,
        concepts_tracked=len(mastery_records),
        concepts_improving=improving_count,
        concepts_needing_attention=attention_count,
    )

    quiz_performance = [
        QuizPerformanceItem(
            attempt_id=attempt.id,
            score_percent=round(
                attempt.score_percent or 0.0,
                2,
            ),
            question_count=attempt.question_count,
            created_at=attempt.created_at.isoformat(),
        )
        for attempt in completed_attempts[:10]
    ]

    concept_trends = []

    for item in mastery_records:
        previous = item.previous_score

        change = (
            item.mastery_score
            if previous is None
            else item.mastery_score - previous
        )

        concept_trends.append(
            ConceptTrendItem(
                concept=item.concept,
                mastery_score=round(
                    item.mastery_score,
                    2,
                ),
                previous_score=(
                    None
                    if previous is None
                    else round(
                        previous,
                        2,
                    )
                ),
                change=round(
                    change,
                    2,
                ),
                trend=item.trend,
                evidence_count=item.evidence_count,
            )
        )

    recent_activity = []

    for material in materials:
        recent_activity.append(
            ActivityItem(
                type="material",
                title="Learning material added",
                description=material.original_filename,
                created_at=material.created_at.isoformat(),
            )
        )

    for attempt in quiz_attempts[:10]:
        if attempt.status == "completed":
            recent_activity.append(
                ActivityItem(
                    type="quiz",
                    title="Quiz completed",
                    description=(
                        f"Score: "
                        f"{attempt.score_percent or 0:.0f}%"
                    ),
                    created_at=(
                        attempt.completed_at
                        or attempt.created_at
                    ).isoformat(),
                )
            )
        else:
            recent_activity.append(
                ActivityItem(
                    type="quiz",
                    title="Quiz started",
                    description=(
                        f"{attempt.question_count} questions"
                    ),
                    created_at=attempt.created_at.isoformat(),
                )
            )

    recent_activity.sort(
        key=lambda item: item.created_at,
        reverse=True,
    )

    return ProjectAnalyticsResponse(
        project_id=project_id,
        summary=summary,
        quiz_performance=quiz_performance,
        concept_trends=concept_trends,
        recent_activity=recent_activity[:10],
    )