from pydantic import BaseModel


class ConceptMasteryResponse(BaseModel):
    concept: str
    mastery_score: float
    previous_score: float | None
    evidence_count: int
    trend: str


class MasteryResponse(BaseModel):
    project_id: int
    overall_mastery: float
    concepts: list[ConceptMasteryResponse]


class GrowthConceptResponse(BaseModel):
    concept: str
    mastery_score: float
    previous_score: float | None
    change: float
    trend: str
    evidence_count: int


class GrowthResponse(BaseModel):
    project_id: int
    overall_mastery: float
    improving: list[GrowthConceptResponse]
    stable: list[GrowthConceptResponse]
    needs_attention: list[GrowthConceptResponse]


class RecommendationResponse(BaseModel):
    type: str
    title: str
    reason: str
    action: str
    concept: str | None
    priority: str


class RecommendationsResponse(BaseModel):
    project_id: int
    recommendations: list[RecommendationResponse]