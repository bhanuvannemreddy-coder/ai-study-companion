from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    stored_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    file_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="application/pdf"
    )

    file_size_bytes: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="queued"
    )

    page_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    error_message: Mapped[str | None] = mapped_column(
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

    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    project = relationship(
        "Project",
        back_populates="materials"
    )
    document_chunks = relationship(
    "DocumentChunk",
    back_populates="material",
    cascade="all, delete-orphan"
)