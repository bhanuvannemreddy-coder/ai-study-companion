from app.services.auth import (
    hash_password,
    verify_password,
)


def test_password_is_hashed():
    password = "TestPassword123!"

    password_hash = hash_password(
        password
    )

    assert password_hash
    assert password_hash != password


def test_correct_password_verifies():
    password = "TestPassword123!"

    password_hash = hash_password(
        password
    )

    assert (
        verify_password(
            password,
            password_hash,
        )
        is True
    )


def test_wrong_password_does_not_verify():
    password = "TestPassword123!"

    password_hash = hash_password(
        password
    )

    assert (
        verify_password(
            "WrongPassword123!",
            password_hash,
        )
        is False
    )


def test_same_password_generates_different_hashes():
    password = "TestPassword123!"

    first_hash = hash_password(
        password
    )

    second_hash = hash_password(
        password
    )

    assert first_hash != second_hash

    assert (
        verify_password(
            password,
            first_hash,
        )
        is True
    )

    assert (
        verify_password(
            password,
            second_hash,
        )
        is True
    )