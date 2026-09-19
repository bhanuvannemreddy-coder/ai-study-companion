from logging.config import fileConfig

from alembic import context

from sqlalchemy import (
    engine_from_config,
    pool,
)

from app.core.config import settings
from app.core.database import Base

from app.models.learning_event import LearningEvent
from app.models.learning_context import LearningContext

from app.models.user import User
from app.models.space import Space
from app.models.project import Project

from app.models.document_chunk import DocumentChunk
from app.models.material import Material

from app.models.quiz_attempt import QuizAttempt
from app.models.quiz_question import QuizQuestion
from app.models.quiz_answer import QuizAnswer

from app.models.concept_mastery import ConceptMastery
from app.models.mastery_snapshot import MasterySnapshot

from app.models.ai_usage import AIUsage
from app.models.ai_evaluation import AIEvaluation


config = context.config


if config.config_file_name is not None:
    fileConfig(
        config.config_file_name
    )


target_metadata = Base.metadata


print(
    "ALEMBIC SEES TABLES:",
    list(
        Base.metadata.tables.keys()
    ),
)


def run_migrations_offline() -> None:
    """Run migrations in offline mode."""

    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in online mode."""

    configuration = config.get_section(
        config.config_ini_section
    )

    configuration[
        "sqlalchemy.url"
    ] = settings.DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()