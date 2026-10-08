"""HIMS interoperability service (Laboratory, NHIA/HMO, Radiology).

Configuration is validated at import time so a misconfigured process fails to
start rather than serving requests with placeholder secrets.
"""

from typing import Any, Dict

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth.jwt import TokenClaims, TokenVerifier
from clients.core_client import AuditLogPayload, CoreServiceClient, CoreServiceError
from config import Settings, load_settings

settings: Settings = load_settings()

app = FastAPI(
    title="HIMS Interoperability Service",
    description="Python/FastAPI microservice for HL7/FHIR Laboratory, NHIA/HMO claims, and Radiology",
    version="0.1.0",
)

# CORS: only the configured browser origins may call this service directly.
# This is not a wildcard -- the service answers with credentials, so "*" would
# let any site issue authenticated requests as a logged-in user. See
# config._cors_allowed_origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

core_client = CoreServiceClient(
    base_url=settings.core_service_url,
    internal_key=settings.internal_service_key,
)

verify_token = TokenVerifier(settings.jwt_secret)


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {
        "status": "ok",
        "service": "interop-py",
    }


@app.get("/api/v1/health")
def api_health_check() -> Dict[str, str]:
    return {
        "status": "healthy",
        "service": "interop-py",
        "version": "v1",
        "core_service_url": core_client.base_url,
    }


from modules.laboratory import router as laboratory_router
from modules.nhia import router as nhia_router
from modules.radiology.router import router as radiology_router

app.include_router(laboratory_router)
app.include_router(nhia_router)
app.include_router(radiology_router)



if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=False)
