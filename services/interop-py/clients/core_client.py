import os
from typing import Any, Dict, Optional
import httpx
from pydantic import BaseModel, Field


class AuditLogPayload(BaseModel):
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    module: str
    action: str
    resource_type: str
    resource_id: str
    details: Dict[str, Any] = Field(default_factory=dict)
    status: str = "SUCCESS"


class CoreServiceClient:
    """Authoritative client for communicating with the Go core service.
    
    Per HIMS Architecture Rules:
    - Never write directly to audit_logs, users, or permissions from Python.
    - Python modules (Lab, NHIA, Radiology) MUST call these methods for mutating actions.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        internal_key: Optional[str] = None,
        timeout: float = 5.0,
    ):
        self.base_url = (base_url or os.getenv("CORE_SERVICE_URL", "http://localhost:8080")).rstrip("/")
        self.internal_key = internal_key or os.getenv("INTERNAL_SERVICE_KEY", "dev_internal_service_key_secret")
        self.timeout = timeout

    def _headers(self) -> Dict[str, str]:
        return {
            "X-Internal-Service-Key": self.internal_key,
            "Content-Type": "application/json",
            "User-Agent": "HIMS-Interop-Python/1.0",
        }

    async def record_audit_log(self, payload: AuditLogPayload) -> bool:
        """Sends an immutable audit log record to Go core service."""
        url = f"{self.base_url}/internal/audit-log"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    url,
                    json=payload.model_dump(exclude_none=True),
                    headers=self._headers(),
                )
                response.raise_for_status()
                return True
            except httpx.HTTPError as exc:
                raise RuntimeError(f"Failed to record audit log on core service: {exc}") from exc

    async def check_authorization(self, role: str, module: str, action: str) -> bool:
        """Queries Go core's authoritative RBAC permission matrix."""
        url = f"{self.base_url}/internal/authz/check"
        params = {"role": role, "module": module, "action": action}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, params=params, headers=self._headers())
                response.raise_for_status()
                data = response.json()
                return bool(data.get("allowed", False))
            except httpx.HTTPError as exc:
                raise RuntimeError(f"Authorization check failed on core service: {exc}") from exc
