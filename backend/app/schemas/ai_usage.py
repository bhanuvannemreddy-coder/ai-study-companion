from pydantic import BaseModel


class AIUsageResponse(BaseModel):
    id: int
    user_id: int
    project_id: int | None
    feature: str
    provider: str | None
    model: str | None
    latency_ms: float | None
    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None
    estimated_cost: float | None
    success: bool
    error_type: str | None
    error_message: str | None
    created_at: str