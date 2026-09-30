import os
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

security = HTTPBearer(auto_error=False)


class TokenClaims(BaseModel):
    user_id: str
    username: str
    role: str
    department: str


def get_jwt_secret() -> str:
    return os.getenv("JWT_SECRET", "dev_insecure_jwt_secret_key_32bytes_long")


def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> TokenClaims:
    """Validates JWT signed by Go core service and extracts user claims."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=["HS256"],
            issuer="hims-core-go",
        )
        return TokenClaims(
            user_id=payload.get("user_id") or payload.get("sub", ""),
            username=payload.get("username", ""),
            role=payload.get("role", ""),
            department=payload.get("department", ""),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {err}",
            headers={"WWW-Authenticate": "Bearer"},
        )
