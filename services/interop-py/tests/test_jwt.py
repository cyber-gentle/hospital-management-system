"""Tests for JWT verification against tokens issued by the Go core service."""

from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from auth.jwt import EXPECTED_AUDIENCE, EXPECTED_ISSUER, TokenVerifier

SECRET = "a-real-jwt-secret-of-sufficient-length-000000"
OTHER_SECRET = "a-different-jwt-secret-of-sufficient-length-000"


def make_token(
    secret: str = SECRET,
    issuer: str = EXPECTED_ISSUER,
    audience: str = EXPECTED_AUDIENCE,
    expires_in: timedelta = timedelta(hours=1),
    algorithm: str = "HS256",
    **overrides: object,
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": "usr_lab_01",
        "username": "lab_tech_john",
        "role": "LAB_SCIENTIST",
        "department": "Laboratory",
        "iss": issuer,
        "aud": audience,
        "iat": now,
        "exp": now + expires_in,
        **overrides,
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


def credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


@pytest.fixture
def verifier() -> TokenVerifier:
    return TokenVerifier(SECRET)


def test_accepts_a_valid_token(verifier: TokenVerifier) -> None:
    claims = verifier(credentials(make_token()))

    assert claims.user_id == "usr_lab_01"
    assert claims.username == "lab_tech_john"
    assert claims.role == "LAB_SCIENTIST"
    assert claims.department == "Laboratory"


def test_falls_back_to_subject_claim(verifier: TokenVerifier) -> None:
    token = make_token(user_id=None, sub="usr_from_sub")

    claims = verifier(credentials(token))

    assert claims.user_id == "usr_from_sub"


def test_rejects_missing_credentials(verifier: TokenVerifier) -> None:
    with pytest.raises(HTTPException) as exc:
        verifier(None)
    assert exc.value.status_code == 401


def test_rejects_token_signed_with_another_secret(verifier: TokenVerifier) -> None:
    with pytest.raises(HTTPException) as exc:
        verifier(credentials(make_token(secret=OTHER_SECRET)))
    assert exc.value.status_code == 401


def test_rejects_expired_token(verifier: TokenVerifier) -> None:
    token = make_token(expires_in=timedelta(minutes=-5))

    with pytest.raises(HTTPException) as exc:
        verifier(credentials(token))
    assert exc.value.status_code == 401
    assert "expired" in exc.value.detail.lower()


def test_rejects_foreign_issuer(verifier: TokenVerifier) -> None:
    """Only the Go core service may issue HIMS tokens."""
    token = make_token(issuer="some-other-service")

    with pytest.raises(HTTPException) as exc:
        verifier(credentials(token))
    assert exc.value.status_code == 401


def test_rejects_foreign_audience(verifier: TokenVerifier) -> None:
    """A token minted for a different audience must not be replayable here."""
    token = make_token(audience="some-other-audience")

    with pytest.raises(HTTPException) as exc:
        verifier(credentials(token))
    assert exc.value.status_code == 401


def test_rejects_unsigned_token(verifier: TokenVerifier) -> None:
    """A token with alg=none, or any non-HS256 algorithm, must be refused."""
    unsigned = jwt.encode(
        {
            "user_id": "usr_evil",
            "username": "attacker",
            "role": "ADMIN",
            "iss": EXPECTED_ISSUER,
            "aud": EXPECTED_AUDIENCE,
        },
        key="",
        algorithm="none",
    )

    with pytest.raises(HTTPException) as exc:
        verifier(credentials(unsigned))
    assert exc.value.status_code == 401


def test_constructor_requires_a_secret() -> None:
    with pytest.raises(ValueError):
        TokenVerifier("")
