from sqlalchemy.orm import Session

from app.models.ai_evaluation import AIEvaluation


UNSUPPORTED_MESSAGE_MARKER = (
    "I couldn't find enough information in "
    "this project's learning materials"
)


def evaluate_tutor_response(
    *,
    grounded: bool,
    answer: str,
    sources: list,
) -> dict:
    """
    Deterministic Tutor evaluation.

    This does not ask another AI model to judge the answer.
    It evaluates observable application-level signals.
    """

    source_count = len(sources)

    max_source_score = None

    if sources:
        scores = [
            source.score
            for source in sources
            if source.score is not None
        ]

        if scores:
            max_source_score = max(scores)

    citation_present = (
        source_count > 0
        and "Sources:" in answer
    )

    unsupported_response = (
        not grounded
        and UNSUPPORTED_MESSAGE_MARKER.lower()
        in answer.lower()
    )

    if grounded:
        overall_pass = (
            grounded
            and citation_present
            and source_count > 0
        )

    else:
        overall_pass = unsupported_response

    return {
        "grounded": grounded,
        "citation_present": citation_present,
        "unsupported_handling": unsupported_response,
        "overall_pass": overall_pass,
        "source_count": source_count,
        "max_source_score": max_source_score,
        "evaluation_method": "rule_based_v1",
        "details": {
            "grounded_rule": (
                "Tutor had sufficiently relevant "
                "project evidence."
                if grounded
                else
                "Tutor did not have sufficiently relevant "
                "project evidence."
            ),
            "citation_rule": (
                "Sources section was present with "
                "at least one source."
                if citation_present
                else
                "No usable source citation was detected."
            ),
            "unsupported_rule": (
                "Tutor explicitly reported insufficient "
                "project evidence."
                if unsupported_response
                else
                "Unsupported handling condition was not triggered."
            ),
        },
    }


def record_ai_evaluation(
    db: Session,
    *,
    user_id: int,
    project_id: int | None,
    feature: str,
    grounded: bool,
    answer: str,
    sources: list,
):
    evaluation = evaluate_tutor_response(
        grounded=grounded,
        answer=answer,
        sources=sources,
    )

    record = AIEvaluation(
        user_id=user_id,
        project_id=project_id,
        feature=feature,
        grounded=evaluation["grounded"],
        citation_present=evaluation["citation_present"],
        unsupported_handling=evaluation[
            "unsupported_handling"
        ],
        overall_pass=evaluation["overall_pass"],
        source_count=evaluation["source_count"],
        max_source_score=evaluation[
            "max_source_score"
        ],
        evaluation_method=evaluation[
            "evaluation_method"
        ],
        details=evaluation["details"],
    )

    db.add(record)
    db.flush()

    return record


def get_ai_evaluations(
    db: Session,
    *,
    project_id: int | None = None,
    feature: str | None = None,
    limit: int = 100,
):
    query = db.query(AIEvaluation)

    if project_id is not None:
        query = query.filter(
            AIEvaluation.project_id == project_id
        )

    if feature is not None:
        query = query.filter(
            AIEvaluation.feature == feature
        )

    return (
        query
        .order_by(
            AIEvaluation.created_at.desc()
        )
        .limit(limit)
        .all()
    )


def get_ai_evaluation_summary(
    db: Session,
):
    total = db.query(
        AIEvaluation
    ).count()

    passed = (
        db.query(AIEvaluation)
        .filter(
            AIEvaluation.overall_pass.is_(True)
        )
        .count()
    )

    failed = (
        db.query(AIEvaluation)
        .filter(
            AIEvaluation.overall_pass.is_(False)
        )
        .count()
    )

    grounded = (
        db.query(AIEvaluation)
        .filter(
            AIEvaluation.grounded.is_(True)
        )
        .count()
    )

    citations = (
        db.query(AIEvaluation)
        .filter(
            AIEvaluation.citation_present.is_(True)
        )
        .count()
    )

    unsupported_handled = (
        db.query(AIEvaluation)
        .filter(
            AIEvaluation.unsupported_handling.is_(True)
        )
        .count()
    )

    return {
        "total_evaluations": total,
        "passed": passed,
        "failed": failed,
        "grounded_responses": grounded,
        "citation_present": citations,
        "unsupported_handled": unsupported_handled,
        "pass_rate": (
            round(
                passed / total * 100,
                2,
            )
            if total
            else 0.0
        ),
        "citation_rate": (
            round(
                citations / total * 100,
                2,
            )
            if total
            else 0.0
        ),
    }