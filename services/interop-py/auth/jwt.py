"""JWT verification for the interop service.

Token *issuance* belongs exclusively to the Go core service (see
ARCHITECTURE.md, "Audit log / RBAC ownership"). This module only verifies
tokens that Go issued -- it never signs, never manages sessions, and never
mints a token of its own.
"""

from __future__ import annotations

from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

# The issuer and audience the Go core service sets on every token it signs.
# Both are checked, so a token minted for another service or another purpose
# cannot be replayed against this one.
EXPECTED_ISSUER = "hims-core-go"
EXPECTED_AUDIENCE = "hims-clients"
SIGNING_ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)


class TokenClaims(BaseModel):
    """Claims carried by a verified HIMS access token."""

    user_id: str
    username: str
    role: str
    department: str


class TokenVerifier:
    """Verifies HIMS access tokens against an injected signing secret.

    The secret is injected rather than read from the environment per request,
    so a misconfigured service fails at startup (see config.load_settings)
    instead of silently accepting tokens signed with a placeholder value.

    Instances are callable so they can be used directly as a FastAPI
    dependency: ``Depends(verifier)``.
    """

    def __init__(self, secret: str) -> None:
        if not secret:
            raise ValueError("a JWT signing secret is required")
        self._secret = secret

    def __call__(
        self,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    ) -> TokenClaims:
        if not credentials or not credentials.credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            payload = jwt.decode(
                credentials.credentials,
                self._secret,
                algorithms=[SIGNING_ALGORITHM],
                issuer=EXPECTED_ISSUER,
                audience=EXPECTED_AUDIENCE,
                options={"require": ["exp", "iss", "aud"]},
            )
            identity = payload.get("user_id") or payload.get("sub", "")
            if not identity or not payload.get("role"):
                raise jwt.InvalidTokenError("Token identity and role are required")
            if payload.get("user_id") and payload.get("sub") and payload["user_id"] != payload["sub"]:
                raise jwt.InvalidTokenError("Token identity and subject disagree")
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            ) from None
        except jwt.InvalidTokenError as err:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {err}",
                headers={"WWW-Authenticate": "Bearer"},
            ) from err

        return TokenClaims(
            user_id=payload.get("user_id") or payload.get("sub", ""),
            username=payload.get("username", ""),
            role=payload.get("role", ""),
            department=payload.get("department", ""),
        )
