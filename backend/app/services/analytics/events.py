from sqlalchemy.orm import Session

from app.models.learning_event import LearningEvent


def record_event(
    db: Session,
    user_id: int,
    event_type: str,
    title: str,
    description: str | None = None,
    project_id: int | None = None,
    space_id: int | None = None,
    event_metadata: dict | None = None,
) -> LearningEvent:

    event = LearningEvent(
        user_id=user_id,
        space_id=space_id,
        project_id=project_id,
        event_type=event_type,
        title=title,
        description=description,
        event_metadata=event_metadata,
    )

    db.add(event)
    db.flush()

    return event


def get_user_events(
    db: Session,
    user_id: int,
    project_id: int | None = None,
    limit: int = 20,
) -> list[LearningEvent]:

    query = (
        db.query(LearningEvent)
        .filter(
            LearningEvent.user_id == user_id
        )
    )

    if project_id is not None:
        query = query.filter(
            LearningEvent.project_id == project_id
        )

    return (
        query
        .order_by(
            LearningEvent.created_at.desc()
        )
        .limit(limit)
        .all()
    )