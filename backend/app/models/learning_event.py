from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)

from app.core.database import Base


class LearningEvent(Base):
    __tablename__ = "learning_events"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    space_id = Column(
        Integer,
        ForeignKey(
            "spaces.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    project_id = Column(
        Integer,
        ForeignKey(
            "projects.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    event_type = Column(
        String(100),
        nullable=False,
        index=True,
    )

    title = Column(
        String(255),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    event_metadata = Column(
        JSON,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )