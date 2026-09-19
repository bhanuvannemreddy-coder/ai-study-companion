from pydantic import BaseModel


class AdminOverviewResponse(BaseModel):
    users: int
    spaces: int
    projects: int

    materials_total: int
    materials_ready: int
    materials_processing: int
    materials_failed: int

    quiz_attempts: int
    completed_quizzes: int
    questions_answered: int
    average_quiz_score: float

    concepts_tracked: int
    overall_mastery: float


class AdminUserResponse(BaseModel):
    id: int
    email: str
    role: str
    spaces: int
    projects: int
    quiz_attempts: int
    completed_quizzes: int


class AdminActivityResponse(BaseModel):
    type: str
    title: str
    description: str
    user_email: str | None
    project_name: str | None
    created_at: str


class AdminSystemResponse(BaseModel):
    database: str
    redis: str
    ai_provider: str
    ai_model: str
    material_processing: dict[str, int]


class AdminDashboardResponse(BaseModel):
    overview: AdminOverviewResponse
    users: list[AdminUserResponse]
    activity: list[AdminActivityResponse]
    system: AdminSystemResponse