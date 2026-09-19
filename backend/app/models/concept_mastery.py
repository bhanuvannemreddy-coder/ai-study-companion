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


class ConceptMastery(Base):
    __tablename__ = "concept_mastery"

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

    concept = Column(
        String(255),
        nullable=False,
        index=True,
    )

    mastery_score = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    previous_score = Column(
        Float,
        nullable=True,
    )

    evidence_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    trend = Column(
        String(30),
        nullable=False,
        default="stable",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )