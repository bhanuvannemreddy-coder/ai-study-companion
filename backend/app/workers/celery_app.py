from celery import Celery

from app.core.config import settings

# Register all SQLAlchemy models when the Celery
# process starts. This is required so SQLAlchemy
# can resolve relationship() references.
import app.models  # noqa: F401


celery_app = Celery(
    "ai_study_companion",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.workers.material_tasks",
    ],
)

celery_app.conf.update(
    task_track_started=True,
    result_expires=3600,
    timezone="UTC",
    enable_utc=True,
)