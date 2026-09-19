from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)

from app.core.database import Base


class MasterySnapshot(Base):
    __tablename__ = "mastery_snapshots"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    project_id = Column(
        Integer,
        ForeignKey(
            "projects.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    attempt_id = Column(
        Integer,
        ForeignKey(
            "quiz_attempts.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    concept = Column(
        String(255),
        nullable=False,
        index=True,
    )

    previous_score = Column(
        Float,
        nullable=True,
    )

    new_score = Column(
        Float,
        nullable=False,
    )

    delta = Column(
        Float,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )