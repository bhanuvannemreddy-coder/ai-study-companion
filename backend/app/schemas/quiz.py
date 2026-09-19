from typing import Literal

from pydantic import BaseModel, Field


class QuizGenerateRequest(BaseModel):
    question_count: int = Field(
        default=5,
        ge=3,
        le=10,
    )


class GeneratedQuizQuestion(BaseModel):
    question_type: Literal[
        "mcq",
        "open_ended",
    ]

    question_text: str = Field(
        min_length=1,
    )

    options: list[str] | None = None

    correct_option_index: int | None = None

    expected_answer: str | None = None

    explanation: str = ""

    concept: str = ""

    difficulty: Literal[
        "easy",
        "medium",
        "hard",
    ] = "medium"


class GeneratedQuiz(BaseModel):
    questions: list[GeneratedQuizQuestion]


class QuizQuestionResponse(BaseModel):
    id: int
    question_order: int
    question_type: str
    question_text: str
    options: list[str] | None
    concept: str | None
    difficulty: str


class QuizGenerateResponse(BaseModel):
    attempt_id: int
    project_id: int
    questions: list[QuizQuestionResponse]


class QuizAnswerRequest(BaseModel):
    question_id: int
    answer_text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


class QuizAnswerResponse(BaseModel):
    question_id: int
    is_correct: bool
    score: float
    feedback: str


class QuizCompleteResponse(BaseModel):
    attempt_id: int
    status: str
    answered_questions: int
    total_questions: int
    score_percent: float