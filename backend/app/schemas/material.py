from datetime import datetime

from pydantic import BaseModel


class MaterialResponse(BaseModel):
    id: int
    project_id: int
    original_filename: str
    file_type: str
    file_size_bytes: int
    status: str
    page_count: int | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
    processed_at: datetime | None

    model_config = {"from_attributes": True}