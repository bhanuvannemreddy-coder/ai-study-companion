from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: int
    event_type: str
    title: str
    description: str | None
    project_id: int | None
    space_id: int | None
    metadata: dict | None
    created_at: str