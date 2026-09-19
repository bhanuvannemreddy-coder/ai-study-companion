from sqlalchemy import Column, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

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

    question_order = Column(
        Integer,
        nullable=False,
    )

    question_type = Column(
        String(20),
        nullable=False,
    )

    question_text = Column(
        Text,
        nullable=False,
    )

    options = Column(
        JSON,
        nullable=True,
    )

    correct_option_index = Column(
        Integer,
        nullable=True,
    )

    expected_answer = Column(
        Text,
        nullable=True,
    )

    explanation = Column(
        Text,
        nullable=True,
    )

    concept = Column(
        String(255),
        nullable=True,
    )

    difficulty = Column(
        String(20),
        nullable=False,
        default="medium",
    )

    attempt = relationship(
        "QuizAttempt",
        back_populates="questions",
    )

    answers = relationship(
        "QuizAnswer",
        back_populates="question",
        cascade="all, delete-orphan",
    )