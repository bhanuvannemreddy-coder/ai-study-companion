import pytest
from fastapi import HTTPException

from app.api.quiz import (
    get_owned_attempt,
    get_owned_project,
)


class QueryStub:
    def __init__(self, result):
        self.result = result
        self.join_called = False
        self.filter_called = False

    def join(self, *args, **kwargs):
        self.join_called = True
        return self

    def filter(self, *args, **kwargs):
        self.filter_called = True
        return self

    def first(self):
        return self.result


class DBStub:
    def __init__(self, result):
        self.result = result
        self.query_stub = QueryStub(result)

    def query(self, *args, **kwargs):
        return self.query_stub


class FakeProject:
    id = 10
    space_id = 5


class FakeAttempt:
    id = 100
    project_id = 10
    user_id = 1


def test_owned_project_is_returned():
    project = FakeProject()
    db = DBStub(project)

    result = get_owned_project(
        db=db,
        project_id=project.id,
        user_id=1,
    )

    assert result is project
    assert db.query_stub.join_called is True
    assert db.query_stub.filter_called is True


def test_project_isolation_blocks_missing_project():
    db = DBStub(None)

    with pytest.raises(HTTPException) as exc_info:
        get_owned_project(
            db=db,
            project_id=10,
            user_id=999,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Project not found."


def test_owned_quiz_attempt_is_returned():
    attempt = FakeAttempt()
    db = DBStub(attempt)

    result = get_owned_attempt(
        db=db,
        attempt_id=attempt.id,
        project_id=attempt.project_id,
        user_id=attempt.user_id,
    )

    assert result is attempt
    assert db.query_stub.filter_called is True


def test_quiz_attempt_isolation_blocks_other_user():
    db = DBStub(None)

    with pytest.raises(HTTPException) as exc_info:
        get_owned_attempt(
            db=db,
            attempt_id=100,
            project_id=10,
            user_id=999,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Quiz attempt not found."