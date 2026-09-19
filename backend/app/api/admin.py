from sqlalchemy import text
from sqlalchemy.orm import Session
import redis

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user

from app.models.material import Material
from app.models.project import Project
from app.models.quiz_answer import QuizAnswer
from app.models.quiz_attempt import QuizAttempt
from app.models.space import Space
from app.models.user import User
from app.models.concept_mastery import ConceptMastery
from app.models.ai_usage import AIUsage

from app.schemas.admin import (
    AdminActivityResponse,
    AdminDashboardResponse,
    AdminOverviewResponse,
    AdminSystemResponse,
    AdminUserResponse,
)

from app.services.analytics.ai_usage import (
    get_ai_usage,
    get_ai_usage_summary,
)

from app.services.analytics.ai_evaluation import (
    get_ai_evaluations,
    get_ai_evaluation_summary,
)


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


# ==========================================================
# ADMIN ACCESS
# ==========================================================


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return current_user


# ==========================================================
# ADMIN DASHBOARD
# ==========================================================


@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse,
)
def get_admin_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------
    # Global counts
    # --------------------------------------------------

    user_count = db.query(User).count()
    space_count = db.query(Space).count()
    project_count = db.query(Project).count()

    materials = db.query(Material).all()

    material_processing = {
        "queued": 0,
        "processing": 0,
        "ready": 0,
        "failed": 0,
    }

    for material in materials:

        if material.status in material_processing:
            material_processing[
                material.status
            ] += 1

    quiz_attempts = db.query(
        QuizAttempt
    ).all()

    completed_quizzes = [
        attempt
        for attempt in quiz_attempts
        if attempt.status == "completed"
    ]

    scores = [
        attempt.score_percent
        for attempt in completed_quizzes
        if attempt.score_percent is not None
    ]

    average_quiz_score = (
        round(
            sum(scores) / len(scores),
            2,
        )
        if scores
        else 0.0
    )

    questions_answered = (
        db.query(QuizAnswer).count()
    )

    mastery_records = (
        db.query(ConceptMastery).all()
    )

    overall_mastery = (
        round(
            sum(
                record.mastery_score
                for record in mastery_records
            )
            / len(mastery_records),
            2,
        )
        if mastery_records
        else 0.0
    )

    overview = AdminOverviewResponse(
        users=user_count,
        spaces=space_count,
        projects=project_count,
        materials_total=len(materials),
        materials_ready=(
            material_processing["ready"]
        ),
        materials_processing=(
            material_processing["processing"]
            + material_processing["queued"]
        ),
        materials_failed=(
            material_processing["failed"]
        ),
        quiz_attempts=len(quiz_attempts),
        completed_quizzes=len(
            completed_quizzes
        ),
        questions_answered=questions_answered,
        average_quiz_score=average_quiz_score,
        concepts_tracked=len(
            mastery_records
        ),
        overall_mastery=overall_mastery,
    )

    # --------------------------------------------------
    # User overview
    # --------------------------------------------------

    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    user_rows = []

    for user in users:

        user_spaces = (
            db.query(Space)
            .filter(
                Space.user_id == user.id
            )
            .all()
        )

        space_ids = [
            space.id
            for space in user_spaces
        ]

        user_projects = []

        if space_ids:

            user_projects = (
                db.query(Project)
                .filter(
                    Project.space_id.in_(
                        space_ids
                    )
                )
                .all()
            )

        attempts = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.user_id == user.id
            )
            .all()
        )

        completed = [
            attempt
            for attempt in attempts
            if attempt.status == "completed"
        ]

        user_rows.append(
            AdminUserResponse(
                id=user.id,
                email=user.email,
                role=user.role,
                spaces=len(user_spaces),
                projects=len(
                    user_projects
                ),
                quiz_attempts=len(attempts),
                completed_quizzes=len(
                    completed
                ),
            )
        )

    # --------------------------------------------------
    # Recent activity
    # --------------------------------------------------

    activity = []

    recent_materials = (
        db.query(
            Material,
            Project,
            Space,
            User,
        )
        .join(
            Project,
            Material.project_id
            == Project.id,
        )
        .join(
            Space,
            Project.space_id
            == Space.id,
        )
        .join(
            User,
            Space.user_id
            == User.id,
        )
        .order_by(
            Material.created_at.desc()
        )
        .limit(10)
        .all()
    )

    for (
        material,
        project,
        space,
        user,
    ) in recent_materials:

        activity.append(
            AdminActivityResponse(
                type="material",
                title="Material uploaded",
                description=(
                    material.original_filename
                ),
                user_email=user.email,
                project_name=project.name,
                created_at=(
                    material.created_at.isoformat()
                ),
            )
        )

    recent_quizzes = (
        db.query(
            QuizAttempt,
            Project,
            User,
        )
        .join(
            Project,
            QuizAttempt.project_id
            == Project.id,
        )
        .join(
            Space,
            Project.space_id
            == Space.id,
        )
        .join(
            User,
            QuizAttempt.user_id
            == User.id,
        )
        .order_by(
            QuizAttempt.created_at.desc()
        )
        .limit(10)
        .all()
    )

    for (
        attempt,
        project,
        user,
    ) in recent_quizzes:

        activity.append(
            AdminActivityResponse(
                type="quiz",
                title=(
                    "Quiz completed"
                    if attempt.status
                    == "completed"
                    else "Quiz started"
                ),
                description=(
                    (
                        f"Score: "
                        f"{attempt.score_percent:.0f}%"
                    )
                    if attempt.score_percent
                    is not None
                    else (
                        f"{attempt.question_count} "
                        f"questions"
                    )
                ),
                user_email=user.email,
                project_name=project.name,
                created_at=(
                    (
                        attempt.completed_at
                        or attempt.created_at
                    ).isoformat()
                ),
            )
        )

    activity.sort(
        key=lambda item: item.created_at,
        reverse=True,
    )

    # --------------------------------------------------
    # System health
    # --------------------------------------------------

    database_status = "healthy"

    try:

        db.execute(
            text("SELECT 1")
        )

    except Exception:

        database_status = "unavailable"

    redis_status = "healthy"

    try:

        redis_client = redis.Redis.from_url(
            settings.REDIS_URL
        )

        redis_client.ping()
        redis_client.close()

    except Exception:

        redis_status = "unavailable"

    system = AdminSystemResponse(
        database=database_status,
        redis=redis_status,
        ai_provider=settings.AI_PROVIDER,
        ai_model=settings.AI_MODEL,
        material_processing=(
            material_processing
        ),
    )

    return AdminDashboardResponse(
        overview=overview,
        users=user_rows,
        activity=activity[:20],
        system=system,
    )


# ==========================================================
# AI USAGE SUMMARY
# ==========================================================


@router.get(
    "/ai-usage/summary",
)
def get_admin_ai_usage_summary(
    current_user: User = Depends(
        require_admin
    ),
    db: Session = Depends(get_db),
):
    summary = get_ai_usage_summary(
        db
    )

    total_requests = (
        summary["total_requests"]
    )

    successful_requests = (
        summary["successful_requests"]
    )

    success_rate = (
        round(
            successful_requests
            / total_requests
            * 100,
            2,
        )
        if total_requests
        else 0.0
    )

    return {
        "total_requests": total_requests,
        "successful_requests": (
            successful_requests
        ),
        "failed_requests": (
            summary["failed_requests"]
        ),
        "success_rate": success_rate,
    }


# ==========================================================
# AI USAGE DETAILS
# ==========================================================


@router.get(
    "/ai-usage",
)
def get_admin_ai_usage(
    project_id: int | None = Query(
        default=None,
    ),
    feature: str | None = Query(
        default=None,
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    current_user: User = Depends(
        require_admin
    ),
    db: Session = Depends(get_db),
):
    usage_records = get_ai_usage(
        db,
        project_id=project_id,
        feature=feature,
        limit=limit,
    )

    return [
        {
            "id": usage.id,
            "user_id": usage.user_id,
            "project_id": usage.project_id,
            "feature": usage.feature,
            "provider": usage.provider,
            "model": usage.model,
            "latency_ms": usage.latency_ms,
            "prompt_tokens": (
                usage.prompt_tokens
            ),
            "completion_tokens": (
                usage.completion_tokens
            ),
            "total_tokens": (
                usage.total_tokens
            ),
            "estimated_cost": (
                usage.estimated_cost
            ),
            "success": usage.success,
            "error_type": (
                usage.error_type
            ),
            "error_message": (
                usage.error_message
            ),
            "created_at": (
                usage.created_at.isoformat()
                if usage.created_at
                else None
            ),
        }
        for usage in usage_records
    ]


# ==========================================================
# AI USAGE FEATURES
# ==========================================================


@router.get(
    "/ai-usage/features",
)
def get_admin_ai_usage_features(
    current_user: User = Depends(
        require_admin
    ),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(AIUsage.feature)
        .distinct()
        .order_by(
            AIUsage.feature.asc()
        )
        .all()
    )

    features = [
        row.feature
        for row in rows
        if row.feature
    ]

    return {
        "features": features,
    }


# ==========================================================
# AI EVALUATION SUMMARY
# ==========================================================


@router.get(
    "/ai-evaluations/summary",
)
def get_admin_ai_evaluation_summary(
    current_user: User = Depends(
        require_admin
    ),
    db: Session = Depends(get_db),
):
    return get_ai_evaluation_summary(
        db
    )


# ==========================================================
# AI EVALUATION DETAILS
# ==========================================================


@router.get(
    "/ai-evaluations",
)
def get_admin_ai_evaluations(
    project_id: int | None = Query(
        default=None,
    ),
    feature: str | None = Query(
        default=None,
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    current_user: User = Depends(
        require_admin
    ),
    db: Session = Depends(get_db),
):
    evaluations = get_ai_evaluations(
        db,
        project_id=project_id,
        feature=feature,
        limit=limit,
    )

    return [
        {
            "id": evaluation.id,
            "user_id": evaluation.user_id,
            "project_id": (
                evaluation.project_id
            ),
            "feature": evaluation.feature,
            "grounded": evaluation.grounded,
            "citation_present": (
                evaluation.citation_present
            ),
            "unsupported_handling": (
                evaluation.unsupported_handling
            ),
            "overall_pass": (
                evaluation.overall_pass
            ),
            "source_count": (
                evaluation.source_count
            ),
            "max_source_score": (
                evaluation.max_source_score
            ),
            "evaluation_method": (
                evaluation.evaluation_method
            ),
            "details": evaluation.details,
            "created_at": (
                evaluation.created_at.isoformat()
                if evaluation.created_at
                else None
            ),
        }
        for evaluation in evaluations
    ]