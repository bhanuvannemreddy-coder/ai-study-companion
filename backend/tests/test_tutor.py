from types import SimpleNamespace

import pytest

from app.services.ai import tutor


class FakeDB:
    def __init__(self):
        self.commit_count = 0

    def commit(self):
        self.commit_count += 1


class FakeProvider:
    def __init__(
        self,
        response="This is a grounded explanation.",
    ):
        self.response = response
        self.calls = []

    def generate(
        self,
        messages,
        temperature,
        db,
        user_id,
        project_id,
        feature,
    ):
        self.calls.append(
            {
                "messages": messages,
                "temperature": temperature,
                "user_id": user_id,
                "project_id": project_id,
                "feature": feature,
            }
        )

        return self.response


def make_learning_context():
    return SimpleNamespace(
        tutor_context=(
            "Student needs simpler explanations."
        ),
        strengths=[
            "Basic circle equations"
        ],
        weaknesses=[
            "Tangent conditions"
        ],
        repeated_mistakes=[
            "Confusing radius and diameter"
        ],
        assessment_summary={
            "average_score": 70
        },
    )


def test_build_context():
    chunks = [
        {
            "source": "Geometry.pdf",
            "page_number": 4,
            "content": "A circle has centre O.",
        },
        {
            "source": "Geometry.pdf",
            "page_number": 5,
            "content": "Radius is the distance from centre.",
        },
    ]

    result = tutor.build_context(
        chunks
    )

    assert "Evidence 1" in result
    assert "Evidence 2" in result
    assert "Geometry.pdf" in result
    assert "Page: 4" in result
    assert "Page: 5" in result


def test_build_sources_removes_duplicate_material_page():
    chunks = [
        {
            "material_id": 1,
            "source": "Geometry.pdf",
            "page_number": 4,
            "score": 0.81,
        },
        {
            "material_id": 1,
            "source": "Geometry.pdf",
            "page_number": 4,
            "score": 0.79,
        },
        {
            "material_id": 1,
            "source": "Geometry.pdf",
            "page_number": 5,
            "score": 0.70,
        },
    ]

    sources = tutor.build_sources(
        chunks
    )

    assert len(sources) == 2
    assert sources[0].page_number == 4
    assert sources[1].page_number == 5


def test_format_source_lines():
    chunks = [
        {
            "material_id": 1,
            "source": "Geometry.pdf",
            "page_number": 4,
            "score": 0.81,
        }
    ]

    sources = tutor.build_sources(
        chunks
    )

    result = tutor.format_source_lines(
        sources
    )

    assert "Sources:" in result
    assert (
        "Geometry.pdf — Page 4"
        in result
    )


def test_build_learning_context():
    context = (
        make_learning_context()
    )

    result = tutor.build_learning_context(
        context
    )

    assert (
        "Student needs simpler explanations."
        in result
    )
    assert (
        "Basic circle equations"
        in result
    )
    assert (
        "Tangent conditions"
        in result
    )
    assert (
        "Confusing radius and diameter"
        in result
    )


def test_unsupported_question_does_not_call_ai(
    monkeypatch,
):
    db = FakeDB()

    monkeypatch.setattr(
        tutor,
        "retrieve_chunks",
        lambda **kwargs: [
            {
                "material_id": 1,
                "source": "Geometry.pdf",
                "page_number": 2,
                "content": "Unrelated content.",
                "score": 0.20,
            }
        ],
    )

    evaluation_calls = []

    monkeypatch.setattr(
        tutor,
        "record_ai_evaluation",
        lambda **kwargs: evaluation_calls.append(
            kwargs
        ),
    )

    class ProviderShouldNotBeCalled:
        def generate(self, *args, **kwargs):
            raise AssertionError(
                "AI provider should not be called "
                "for unsupported questions."
            )

    monkeypatch.setattr(
        tutor,
        "get_ai_provider",
        lambda: ProviderShouldNotBeCalled(),
    )

    response = tutor.answer_question(
        db=db,
        user_id=1,
        project_id=10,
        question=(
            "What is the condition for "
            "two unrelated objects?"
        ),
    )

    assert response.grounded is False
    assert response.sources == []
    assert (
        "couldn't find enough information"
        in response.answer
    )

    assert len(evaluation_calls) == 1
    assert (
        evaluation_calls[0]["grounded"]
        is False
    )

    assert db.commit_count == 1


def test_supported_question_calls_ai(
    monkeypatch,
):
    db = FakeDB()

    monkeypatch.setattr(
        tutor,
        "retrieve_chunks",
        lambda **kwargs: [
            {
                "material_id": 1,
                "source": "Geometry.pdf",
                "page_number": 3,
                "content": (
                    "A tangent touches the "
                    "circle at exactly one point."
                ),
                "score": 0.72,
            }
        ],
    )

    monkeypatch.setattr(
        tutor,
        "get_tutor_context",
        lambda **kwargs: (
            make_learning_context()
        ),
    )

    provider = FakeProvider(
        "A tangent touches a circle at one point."
    )

    monkeypatch.setattr(
        tutor,
        "get_ai_provider",
        lambda: provider,
    )

    evaluation_calls = []

    monkeypatch.setattr(
        tutor,
        "record_ai_evaluation",
        lambda **kwargs: evaluation_calls.append(
            kwargs
        ),
    )

    response = tutor.answer_question(
        db=db,
        user_id=1,
        project_id=10,
        question=(
            "What is a tangent?"
        ),
    )

    assert response.grounded is True

    assert len(response.sources) == 1

    assert (
        "Sources:"
        in response.answer
    )

    assert (
        "Geometry.pdf — Page 3"
        in response.answer
    )

    assert len(provider.calls) == 1

    assert (
        provider.calls[0]["feature"]
        == "tutor"
    )

    assert (
        provider.calls[0]["user_id"]
        == 1
    )

    assert (
        provider.calls[0]["project_id"]
        == 10
    )

    assert len(evaluation_calls) == 1

    assert (
        evaluation_calls[0]["grounded"]
        is True
    )

    assert db.commit_count == 1