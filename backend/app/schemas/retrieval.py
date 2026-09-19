from pydantic import BaseModel, Field


class RetrievalRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        max_length=2000,
    )

    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
    )


class RetrievedChunk(BaseModel):
    chunk_id: int
    material_id: int
    source: str
    page_number: int
    content: str
    score: float


class RetrievalResponse(BaseModel):
    query: str
    results: list[RetrievedChunk]