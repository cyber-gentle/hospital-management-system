"""Tests for the fail-closed configuration loader."""

import pytest

from config import (
    DEFAULT_CORS_ORIGINS,
    INSECURE_PLACEHOLDERS,
    MIN_INTERNAL_KEY_LEN,
    MIN_JWT_SECRET_LEN,
    ConfigurationError,
    load_settings,
)

VALID_JWT_SECRET = "a-real-jwt-secret-of-sufficient-length-000000"
VALID_INTERNAL_KEY = "a-real-internal-service-key"


@pytest.fixture
def valid_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", VALID_JWT_SECRET)
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", VALID_INTERNAL_KEY)
    # Cleared so a CORS setting in the ambient environment cannot change what
    # these tests observe.
    monkeypatch.delenv("CORS_ALLOWED_ORIGINS", raising=False)


def test_loads_valid_settings(valid_env: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PORT", "9999")
    monkeypatch.setenv("CORE_SERVICE_URL", "http://core-go:8080/")

    settings = load_settings()

    assert settings.jwt_secret == VALID_JWT_SECRET
    assert settings.internal_service_key == VALID_INTERNAL_KEY
    assert settings.port == 9999
    # Trailing slashes are trimmed so URL joins stay well-formed.
    assert settings.core_service_url == "http://core-go:8080"


def test_defaults_port_and_core_url(valid_env: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("PORT", raising=False)
    monkeypatch.delenv("CORE_SERVICE_URL", raising=False)

    settings = load_settings()

    assert settings.port == 8000
    assert settings.core_service_url == "http://localhost:8080"


def test_fails_when_jwt_secret_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", VALID_INTERNAL_KEY)

    with pytest.raises(ConfigurationError, match="JWT_SECRET"):
        load_settings()


def test_fails_when_internal_key_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", VALID_JWT_SECRET)
    monkeypatch.delenv("INTERNAL_SERVICE_KEY", raising=False)

    with pytest.raises(ConfigurationError, match="INTERNAL_SERVICE_KEY"):
        load_settings()


def test_fails_when_jwt_secret_too_short(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "x" * (MIN_JWT_SECRET_LEN - 1))
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", VALID_INTERNAL_KEY)

    with pytest.raises(ConfigurationError, match="at least"):
        load_settings()


def test_fails_when_internal_key_too_short(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", VALID_JWT_SECRET)
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", "y" * (MIN_INTERNAL_KEY_LEN - 1))

    with pytest.raises(ConfigurationError, match="at least"):
        load_settings()


@pytest.mark.parametrize("placeholder", sorted(INSECURE_PLACEHOLDERS))
def test_rejects_known_placeholders(
    placeholder: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The values that used to be in-code fallbacks are published in this
    repository, so configuring one explicitly must still be refused."""
    monkeypatch.setenv("JWT_SECRET", placeholder)
    monkeypatch.setenv("INTERNAL_SERVICE_KEY", placeholder)

    with pytest.raises(ConfigurationError, match="placeholder"):
        load_settings()


def test_rejects_non_integer_port(valid_env: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PORT", "not-a-port")

    with pytest.raises(ConfigurationError, match="PORT"):
        load_settings()


# ---------------------------------------------------------------------------
# CORS origins
# ---------------------------------------------------------------------------


def test_defaults_to_the_frontend_dev_origin(valid_env: None) -> None:
    """With nothing configured the service must not fall back to a wildcard."""
    assert load_settings().cors_allowed_origins == DEFAULT_CORS_ORIGINS
    assert "*" not in load_settings().cors_allowed_origins


def test_parses_a_comma_separated_origin_list(
    valid_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv(
        "CORS_ALLOWED_ORIGINS",
        " https://hims.example.org , http://localhost:5173/ ",
    )

    origins = load_settings().cors_allowed_origins

    # Whitespace is trimmed and trailing slashes dropped, so an operator cannot
    # silently fail to match by writing the origin the way a browser shows it.
    assert origins == ("https://hims.example.org", "http://localhost:5173")


def test_rejects_a_wildcard_origin(
    valid_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A wildcard origin alongside allow_credentials lets any site act as the
    logged-in user, so it must be a startup error rather than a warning."""
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "*")

    with pytest.raises(ConfigurationError, match="must not be"):
        load_settings()


def test_rejects_a_wildcard_hidden_in_a_list(
    valid_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "https://hims.example.org,*")

    with pytest.raises(ConfigurationError, match="must not be"):
        load_settings()


def test_rejects_an_origin_without_a_scheme(
    valid_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "hims.example.org")

    with pytest.raises(ConfigurationError, match="scheme"):
        load_settings()


def test_blank_origin_setting_falls_back_to_the_default(
    valid_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "   ")

    assert load_settings().cors_allowed_origins == DEFAULT_CORS_ORIGINS
