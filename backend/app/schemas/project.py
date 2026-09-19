from datetime import datetime

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    learning_goal: str | None = None


class ProjectResponse(BaseModel):
    id: int
    space_id: int
    name: str
    description: str | None
    learning_goal: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}