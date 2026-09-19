from datetime import datetime

from pydantic import BaseModel


class SpaceCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectSummaryResponse(BaseModel):
    id: int
    space_id: int
    name: str
    description: str | None = None
    learning_goal: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class SpaceResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class SpaceWithProjectsResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    projects: list[ProjectSummaryResponse] = []

    model_config = {
        "from_attributes": True
    }