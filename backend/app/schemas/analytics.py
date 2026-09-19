from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    materials_total: int
    materials_ready: int
    quiz_attempts: int
    completed_quizzes: int
    questions_answered: int
    average_quiz_score: float
    overall_mastery: float
    concepts_tracked: int
    concepts_improving: int
    concepts_needing_attention: int


class QuizPerformanceItem(BaseModel):
    attempt_id: int
    score_percent: float
    question_count: int
    created_at: str


class ConceptTrendItem(BaseModel):
    concept: str
    mastery_score: float
    previous_score: float | None
    change: float
    trend: str
    evidence_count: int


class ActivityItem(BaseModel):
    type: str
    title: str
    description: str
    created_at: str


class ProjectAnalyticsResponse(BaseModel):
    project_id: int
    summary: AnalyticsSummary
    quiz_performance: list[QuizPerformanceItem]
    concept_trends: list[ConceptTrendItem]
    recent_activity: list[ActivityItem]