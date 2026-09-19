from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.activity import ActivityResponse
from app.services.analytics.events import get_user_events


router = APIRouter(
    prefix="/api",
    tags=["Activity"],
)


@router.get(
    "/activity",
    response_model=list[ActivityResponse],
)
def get_activity(
    project_id: int | None = None,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = min(
        max(limit, 1),
        100,
    )

    events = get_user_events(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        limit=limit,
    )

    return [
        ActivityResponse(
            id=event.id,
            event_type=event.event_type,
            title=event.title,
            description=event.description,
            project_id=event.project_id,
            space_id=event.space_id,
            metadata=event.event_metadata,
            created_at=event.created_at.isoformat(),
        )
        for event in events
    ]