import os
from typing import Any, Dict
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth.jwt import TokenClaims, verify_token
from clients.core_client import AuditLogPayload, CoreServiceClient

app = FastAPI(
    title="HIMS Interoperability Service",
    description="Python/FastAPI microservice for HL7/FHIR Laboratory, NHIA/HMO claims, and Radiology",
    version="0.1.0",
)

# CORS Middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

core_client = CoreServiceClient()


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
    # 1. Authoritative RBAC check via Go core
    is_allowed = await core_client.check_authorization(
        role=user.role,
        module="laboratory",
        action="create_order",
    )
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: role is not authorized for laboratory:create_order",
        )

    # 2. Mutating action: mandatory call to Go's /internal/audit-log
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
    await core_client.record_audit_log(audit_entry)

    return {
        "status": "created",
        "order_id": order.order_id,
        "recorded_by": user.username,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
