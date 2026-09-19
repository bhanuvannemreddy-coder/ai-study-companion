from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_count = Column(
        Integer,
        nullable=False,
    )

    status = Column(
        String(20),
        nullable=False,
        default="in_progress",
    )

    score_percent = Column(
        Float,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    completed_at = Column(
        DateTime,
        nullable=True,
    )

    project = relationship(
        "Project",
        back_populates="quiz_attempts",
    )

    user = relationship(
        "User",
    )

    questions = relationship(
        "QuizQuestion",
        back_populates="attempt",
        cascade="all, delete-orphan",
    )

    answers = relationship(
        "QuizAnswer",
        back_populates="attempt",
        cascade="all, delete-orphan",
    )