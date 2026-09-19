from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Text
from app.core.database import Base


class LearningContext(Base):
    __tablename__ = "learning_contexts"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Persistent learner information
    preferences = Column(JSON, nullable=True)

    strengths = Column(JSON, nullable=True)

    weaknesses = Column(JSON, nullable=True)

    repeated_mistakes = Column(JSON, nullable=True)

    important_history = Column(JSON, nullable=True)

    assessment_summary = Column(JSON, nullable=True)

    # Compact summary that can be injected into relevant Tutor requests.
    tutor_context = Column(Text, nullable=True)

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