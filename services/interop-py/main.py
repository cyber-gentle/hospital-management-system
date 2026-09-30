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


# Demonstration endpoint showing mandatory RBAC check and audit log recording via core_client
class SampleLabOrder(BaseModel):
    order_id: str
    patient_id: str
    test_code: str


@app.post("/api/v1/laboratory/orders", status_code=status.HTTP_201_CREATED)
async def create_laboratory_order(
    order: SampleLabOrder,
    user: TokenClaims = Depends(verify_token),
) -> Dict[str, Any]:
    # 1. Authoritative RBAC check via Go core. An unreachable authority is a
    #    503, never a silent allow.
    try:
        is_allowed = await core_client.check_authorization(
            role=user.role,
            module="laboratory",
            action="create_order",
        )
    except CoreServiceError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authorization service unavailable",
        ) from err

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: role is not authorized for laboratory:create_order",
        )

    # 2. Mutating action: mandatory call to Go's /internal/audit-log. If the
    #    entry cannot be recorded the action is not reported as successful.
    audit_entry = AuditLogPayload(
        user_id=user.user_id,
        user_name=user.username,
        user_role=user.role,
        module="laboratory",
        action="CREATE_LAB_ORDER",
        resource_type="LabOrder",
        resource_id=order.order_id,
        details={
            "patient_id": order.patient_id,
            "test_code": order.test_code,
        },
        status="SUCCESS",
    )
    try:
        await core_client.record_audit_log(audit_entry)
    except CoreServiceError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Audit logging unavailable; the action was not completed",
        ) from err

    return {
        "status": "created",
        "order_id": order.order_id,
        "recorded_by": user.username,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
