import pytest

from app.services.ai.provider import (
    AIProviderError,
)

from app.services.learning.quiz import (
    clean_json_response,
    normalize_question,
    validate_generated_quiz,
)


def valid_mcq(
    question_text="What is a circle?",
):
    return {
        "question_type": "mcq",
        "question_text": question_text,
        "options": [
            "Option A",
            "Option B",
            "Option C",
            "Option D",
        ],
        "correct_option_index": 0,
        "expected_answer": None,
        "explanation": (
            "This is the explanation."
        ),
        "concept": "Circles",
        "difficulty": "medium",
    }


def valid_open_ended(
    question_text="Explain a circle.",
):
    return {
        "question_type": "open_ended",
        "question_text": question_text,
        "options": None,
        "correct_option_index": None,
        "expected_answer": (
            "A circle is a set of points "
            "equidistant from a fixed point."
        ),
        "explanation": (
            "This is the explanation."
        ),
        "concept": "Circles",
        "difficulty": "medium",
    }


def test_clean_json_response_removes_markdown_fence():
    raw = """```json
{
    "questions": []
}
```"""

    cleaned = clean_json_response(
        raw
    )

    assert cleaned == (
        '{\n'
        '    "questions": []\n'
        '}'
    )


def test_normalize_question():
    question = (
        "  What   is   a   circle?  "
    )

    result = normalize_question(
        question
    )

    assert result == (
        "what is a circle?"
    )


def test_validate_mcq_quiz():
    payload = {
        "questions": [
            valid_mcq(),
            valid_mcq(
                "Which point is the centre?"
            ),
        ]
    }

    result = validate_generated_quiz(
        payload=payload,
        question_count=2,
        previous_questions=set(),
    )

    assert len(result.questions) == 2
    assert (
        result.questions[0].question_type
        == "mcq"
    )


def test_validate_mixed_quiz():
    payload = {
        "questions": [
            valid_mcq(),
            valid_open_ended(),
        ]
    }

    result = validate_generated_quiz(
        payload=payload,
        question_count=2,
        previous_questions=set(),
    )

    assert len(result.questions) == 2
    assert (
        result.questions[1].question_type
        == "open_ended"
    )


def test_wrong_question_count_is_rejected():
    payload = {
        "questions": [
            valid_mcq(),
        ]
    }

    with pytest.raises(
        AIProviderError
    ):
        validate_generated_quiz(
            payload=payload,
            question_count=2,
            previous_questions=set(),
        )


def test_duplicate_questions_are_rejected():
    payload = {
        "questions": [
            valid_mcq(
                "What is a circle?"
            ),
            valid_mcq(
                "What is a circle?"
            ),
        ]
    }

    with pytest.raises(
        AIProviderError,
        match="duplicate",
    ):
        validate_generated_quiz(
            payload=payload,
            question_count=2,
            previous_questions=set(),
        )


def test_previous_question_is_rejected():
    payload = {
        "questions": [
            valid_mcq(
                "What is a circle?"
            ),
        ]
    }

    previous_questions = {
        "what is a circle?"
    }

    with pytest.raises(
        AIProviderError,
        match="repeated",
    ):
        validate_generated_quiz(
            payload=payload,
            question_count=1,
            previous_questions=previous_questions,
        )


def test_mcq_requires_four_options():
    question = valid_mcq()

    question["options"] = [
        "Option A",
        "Option B",
    ]

    payload = {
        "questions": [
            question,
        ]
    }

    with pytest.raises(
        AIProviderError,
        match="four options",
    ):
        validate_generated_quiz(
            payload=payload,
            question_count=1,
            previous_questions=set(),
        )


def test_mcq_rejects_invalid_correct_option():
    question = valid_mcq()

    question[
        "correct_option_index"
    ] = 7

    payload = {
        "questions": [
            question,
        ]
    }

    with pytest.raises(
        AIProviderError,
        match="invalid correct option",
    ):
        validate_generated_quiz(
            payload=payload,
            question_count=1,
            previous_questions=set(),
        )


def test_open_ended_requires_expected_answer():
    question = valid_open_ended()

    question[
        "expected_answer"
    ] = None

    payload = {
        "questions": [
            question,
        ]
    }

    with pytest.raises(
        AIProviderError,
        match="expected answer",
    ):
        validate_generated_quiz(
            payload=payload,
            question_count=1,
            previous_questions=set(),
        )