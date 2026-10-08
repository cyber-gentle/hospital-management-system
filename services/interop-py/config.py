"""Validated process configuration for the interop service.

This module deliberately fails closed. An earlier revision of the client and
token-verification code substituted hard-coded development secrets whenever
JWT_SECRET or INTERNAL_SERVICE_KEY was unset, which meant a deployment that
forgot to configure them would still start -- and would then verify tokens and
authenticate service-to-service calls with a value published in this repository.

A missing or placeholder secret is now a startup error.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

# Minimum secret lengths. HMAC-SHA256 keys shorter than the 32-byte block size
# carry less entropy than the hash function can use.
MIN_JWT_SECRET_LEN = 32
MIN_INTERNAL_KEY_LEN = 16

# Values that have appeared in this repository's documentation and compose files
# as development defaults. They are rejected outright: if one of these reaches a
# running service it means a real secret was never configured.
INSECURE_PLACEHOLDERS = frozenset(
    {
        "dev_insecure_jwt_secret_key_32bytes_long",
        "dev_internal_service_key_secret",
    }
)


class ConfigurationError(RuntimeError):
    """Raised when required configuration is missing, short, or a known placeholder."""


# Vite's dev server, per .env.example (FRONTEND_PORT=5173). Browsers on that
# origin are the only ones that need to call this service directly; everything
# else arrives through the reverse proxy, server-to-server.
DEFAULT_CORS_ORIGINS = ("http://localhost:5173",)


@dataclass(frozen=True)
class Settings:
    """Validated runtime settings."""

    jwt_secret: str
    internal_service_key: str
    core_service_url: str
    database_url: str
    port: int
    cors_allowed_origins: tuple[str, ...]

def _cors_allowed_origins() -> tuple[str, ...]:
    """Read the browser origins permitted to call this service.

    Defaults to the frontend dev server rather than a wildcard. This service
    answers with credentials (``allow_credentials=True``), so a wildcard origin
    would let any website issue authenticated cross-origin requests on behalf of
    a logged-in user. Starlette would honour that by echoing the caller's origin
    back with ``Access-Control-Allow-Credentials: true`` -- the browser's own
    refusal to combine ``*`` with credentials does not protect against it.
    """
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if not raw.strip():
        return DEFAULT_CORS_ORIGINS

    origins = tuple(
        origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()
    )
    if not origins:
        return DEFAULT_CORS_ORIGINS

    for origin in origins:
        if origin == "*":
            raise ConfigurationError(
                "CORS_ALLOWED_ORIGINS must not be '*'. This service sends "
                "credentialed responses, so a wildcard origin would let any site "
                "make authenticated requests as a logged-in user. List the "
                "origins explicitly, comma-separated."
            )
        if "://" not in origin:
            raise ConfigurationError(
                f"CORS_ALLOWED_ORIGINS entry {origin!r} is missing a scheme; "
                "write it as e.g. https://hims.example.org"
            )

    return origins

def _required_secret(name: str, min_len: int, generate_hint: str) -> str:
    value = os.getenv(name, "")

    if not value:
        raise ConfigurationError(
            f"{name} is not set; generate one with `{generate_hint}` "
            "and set it before starting the service"
        )

    if value.lower() in INSECURE_PLACEHOLDERS:
        raise ConfigurationError(
            f"{name} is set to a known development placeholder published in "
            "this repository; generate a real secret with `{generate_hint}`"
        )

    if len(value) < min_len:
        raise ConfigurationError(
            f"{name} must be at least {min_len} bytes, got {len(value)}; "
            f"generate one with `{generate_hint}`"
        )

    return value

def load_settings() -> Settings:
    """Read and validate settings from the environment.

    Raises:
        ConfigurationError: if a required secret is missing, too short, or one
            of the known development placeholders.
    """
    port_raw = os.getenv("PORT", "8000")
    try:
        port = int(port_raw)
    except ValueError as exc:
        raise ConfigurationError(f"PORT must be an integer, got {port_raw!r}") from exc

    database_url = os.getenv("DATABASE_URL", "postgresql://hims_app:hims_dev_password@localhost:5432/hims")

    return Settings(
        jwt_secret=_required_secret("JWT_SECRET", MIN_JWT_SECRET_LEN, "openssl rand -base64 48"),
        internal_service_key=_required_secret(
            "INTERNAL_SERVICE_KEY", MIN_INTERNAL_KEY_LEN, "openssl rand -base64 32"
        ),
        core_service_url=os.getenv("CORE_SERVICE_URL", "http://localhost:8080").rstrip("/"),
        database_url=database_url,
        port=port,
        cors_allowed_origins=_cors_allowed_origins(),
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process settings, loading and validating them once."""
    return load_settings()
