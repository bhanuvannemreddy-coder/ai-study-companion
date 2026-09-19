from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.project import Project
from app.models.space import Space
from app.models.user import User
from app.schemas.mastery import (
    ConceptMasteryResponse,
    GrowthConceptResponse,
    GrowthResponse,
    MasteryResponse,
    RecommendationResponse,
    RecommendationsResponse,
)
from app.services.learning.mastery import (
    get_project_mastery,
)
from app.services.learning.recommendations import (
    build_recommendations,
)


router = APIRouter(
    prefix="/api",
    tags=["Learning State"],
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
    "/projects/{project_id}/mastery",
    response_model=MasteryResponse,
)
def get_mastery(
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

    records = get_project_mastery(
        db,
        project_id,
    )

    if records:
        overall = round(
            sum(
                item.mastery_score
                for item in records
            )
            / len(records),
            2,
        )
    else:
        overall = 0.0

    return MasteryResponse(
        project_id=project_id,
        overall_mastery=overall,
        concepts=[
            ConceptMasteryResponse(
                concept=item.concept,
                mastery_score=item.mastery_score,
                previous_score=item.previous_score,
                evidence_count=item.evidence_count,
                trend=item.trend,
            )
            for item in records
        ],
    )


@router.get(
    "/projects/{project_id}/growth",
    response_model=GrowthResponse,
)
def get_growth(
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

    records = get_project_mastery(
        db,
        project_id,
    )

    concepts = []

    for item in records:
        previous = item.previous_score

        change = (
            item.mastery_score
            if previous is None
            else item.mastery_score - previous
        )

        concepts.append(
            GrowthConceptResponse(
                concept=item.concept,
                mastery_score=item.mastery_score,
                previous_score=previous,
                change=round(
                    change,
                    2,
                ),
                trend=item.trend,
                evidence_count=item.evidence_count,
            )
        )

    overall = round(
        sum(
            item.mastery_score
            for item in records
        )
        / len(records),
        2,
    ) if records else 0.0

    return GrowthResponse(
        project_id=project_id,
        overall_mastery=overall,
        improving=[
            item
            for item in concepts
            if item.trend == "improving"
        ],
        stable=[
            item
            for item in concepts
            if item.trend == "stable"
        ],
        needs_attention=[
            item
            for item in concepts
            if item.trend == "needs_attention"
        ],
    )


@router.get(
    "/projects/{project_id}/recommendations",
    response_model=RecommendationsResponse,
)
def get_recommendations(
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

    records = get_project_mastery(
        db,
        project_id,
    )

    recommendations = build_recommendations(
        records
    )

    return RecommendationsResponse(
        project_id=project_id,
        recommendations=[
            RecommendationResponse(**item)
            for item in recommendations
        ],
    )