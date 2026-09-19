from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from app.core.database import Base


class AIEvaluation(Base):
    __tablename__ = "ai_evaluations"

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

    project_id = Column(
        Integer,
        ForeignKey(
            "projects.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    feature = Column(
        String(100),
        nullable=False,
        index=True,
    )

    grounded = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    citation_present = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    unsupported_handling = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    overall_pass = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    source_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    max_source_score = Column(
        Float,
        nullable=True,
    )

    evaluation_method = Column(
        String(100),
        nullable=False,
        default="rule_based_v1",
    )

    details = Column(
        JSON,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )