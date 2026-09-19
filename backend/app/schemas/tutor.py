from pydantic import BaseModel, Field


class TutorRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=3000,
    )

    top_k: int = Field(
        default=5,
        ge=1,
        le=8,
    )


class TutorSource(BaseModel):
    material_id: int
    source: str
    page_number: int
    score: float


class TutorResponse(BaseModel):
    question: str
    answer: str
    grounded: bool
    sources: list[TutorSource]