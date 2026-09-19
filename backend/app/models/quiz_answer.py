from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(
        Integer,
        primary_key=True,
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

    question_id = Column(
        Integer,
        ForeignKey(
            "quiz_questions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    answer_text = Column(
        Text,
        nullable=False,
    )

    is_correct = Column(
        Boolean,
        nullable=True,
    )

    score = Column(
        Float,
        nullable=True,
    )

    feedback = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    attempt = relationship(
        "QuizAttempt",
        back_populates="answers",
    )

    question = relationship(
        "QuizQuestion",
        back_populates="answers",
    )