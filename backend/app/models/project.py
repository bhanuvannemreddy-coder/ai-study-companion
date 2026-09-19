from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    space_id: Mapped[int] = mapped_column(
        ForeignKey("spaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    learning_goal: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    space = relationship(
        "Space",
        back_populates="projects"
    )

    materials = relationship(
    "Material",
    back_populates="project",
    cascade="all, delete-orphan"
)
    document_chunks = relationship(
    "DocumentChunk",
    back_populates="project",
    cascade="all, delete-orphan"
)
    quiz_attempts = relationship(
    "QuizAttempt",
    back_populates="project",
    cascade="all, delete-orphan",
)