import pytest
from fastapi import HTTPException
from types import SimpleNamespace

from app.api.admin import require_admin


def make_user(role: str):
    return SimpleNamespace(
        id=1,
        email="test@example.com",
        role=role,
    )


def test_admin_user_is_allowed():
    admin_user = make_user("admin")

    result = require_admin(
        current_user=admin_user,
    )

    assert result is admin_user
    assert result.role == "admin"


@pytest.mark.parametrize(
    "role",
    [
        "user",
        "student",
        "viewer",
        "",
        None,
    ],
)
def test_non_admin_user_is_rejected(role):
    user = make_user(role)

    with pytest.raises(HTTPException) as exc_info:
        require_admin(
            current_user=user,
        )

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Admin access required"