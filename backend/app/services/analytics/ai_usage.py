from datetime import datetime

from sqlalchemy.orm import Session

from app.models.ai_usage import AIUsage


def record_ai_usage(
    db: Session,
    *,
    user_id: int,
    feature: str,
    provider: str | None = None,
    model: str | None = None,
    project_id: int | None = None,
    latency_ms: float | None = None,
    prompt_tokens: int | None = None,
    completion_tokens: int | None = None,
    total_tokens: int | None = None,
    estimated_cost: float | None = None,
    success: bool = True,
    error_type: str | None = None,
    error_message: str | None = None,
):
    usage = AIUsage(
        user_id=user_id,
        project_id=project_id,
        feature=feature,
        provider=provider,
        model=model,
        latency_ms=latency_ms,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        estimated_cost=estimated_cost,
        success=success,
        error_type=error_type,
        error_message=error_message,
        created_at=datetime.utcnow(),
    )

    db.add(usage)
    db.flush()

    return usage


def get_ai_usage(
    db: Session,
    *,
    user_id: int | None = None,
    project_id: int | None = None,
    feature: str | None = None,
    limit: int = 100,
):
    query = db.query(AIUsage)

    if user_id is not None:
        query = query.filter(AIUsage.user_id == user_id)

    if project_id is not None:
        query = query.filter(AIUsage.project_id == project_id)

    if feature is not None:
        query = query.filter(AIUsage.feature == feature)

    return (
        query
        .order_by(AIUsage.created_at.desc())
        .limit(limit)
        .all()
    )


def get_ai_usage_summary(db: Session):
    total_requests = db.query(AIUsage).count()

    successful_requests = (
        db.query(AIUsage)
        .filter(AIUsage.success.is_(True))
        .count()
    )

    failed_requests = (
        db.query(AIUsage)
        .filter(AIUsage.success.is_(False))
        .count()
    )

    return {
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
    }