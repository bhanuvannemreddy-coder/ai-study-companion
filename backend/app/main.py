from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.api.spaces import router as spaces_router
from app.api.auth import router as auth_router
from app.core.database import get_db
from app.api.projects import router as projects_router
from app.api.materials import router as materials_router
from fastapi.middleware.cors import CORSMiddleware
from app.api import retrieval
from app.api import tutor
from app.api import quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz_question import QuizQuestion
from app.models.quiz_answer import QuizAnswer
from app.api import mastery
from app.api import analytics
from app.api import admin
from app.api import activity
app = FastAPI(
    title="AI Study Companion API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(mastery.router)
app.include_router(materials_router)
app.include_router(projects_router)
app.include_router(auth_router)
app.include_router(retrieval.router)
app.include_router(spaces_router)
app.include_router(tutor.router)
app.include_router(quiz.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(activity.router)
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "AI Study Companion API"
    }


@app.get("/health/db")
def database_health_check(
    db: Session = Depends(get_db)
):
    db.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected"
    }