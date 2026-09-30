"""The interop service's single point of contact with the Go core service.

Per ARCHITECTURE.md:
- Python never writes directly to audit_logs, users, or permission tables.
- Python never reimplements the RBAC permission matrix.
- This is the only module that talks to the core service; module code must not
  make ad-hoc HTTP calls of its own.

The internal service key is injected by the caller (see config.load_settings)
rather than defaulted here, so a service started without a real key fails at
startup instead of presenting a placeholder published in this repository.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

import httpx
from pydantic import BaseModel, Field


class AuditLogPayload(BaseModel):
    """A single immutable audit entry to be written by the core service."""

    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    module: str
    action: str
    resource_type: str
    resource_id: str
    details: Dict[str, Any] = Field(default_factory=dict)
    status: str = "SUCCESS"


class CoreServiceError(RuntimeError):
    """Raised when the core service cannot be reached or rejects a request."""


class CoreServiceClient:
    """Authoritative client for communicating with the Go core service."""

    def __init__(
        self,
        base_url: str,
        internal_key: str,
        timeout: float = 5.0,
    ) -> None:
        if not base_url:
            raise ValueError("a core service base URL is required")
        if not internal_key:
            raise ValueError("an internal service key is required")

        self.base_url = base_url.rstrip("/")
        self.internal_key = internal_key
        self.timeout = timeout

    def _headers(self) -> Dict[str, str]:
        return {
            "X-Internal-Service-Key": self.internal_key,
            "Content-Type": "application/json",
            "User-Agent": "HIMS-Interop-Python/1.0",
        }

    async def record_audit_log(self, payload: AuditLogPayload) -> bool:
        """Send an immutable audit record to the core service.

        Raises:
            CoreServiceError: if the core service is unreachable or refuses the
                entry. Callers must not treat a failed audit write as success.
        """
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
                raise CoreServiceError(
                    f"Failed to record audit log on core service: {exc}"
                ) from exc

    async def check_authorization(self, role: str, module: str, action: str) -> bool:
        """Resolve a permission decision from the core service's authoritative matrix.

        Raises:
            CoreServiceError: if the core service is unreachable. A failure to
                reach the authority is not a denial of permission -- callers
                must not fall back to allowing the request.
        """
        url = f"{self.base_url}/internal/authz/check"
        params = {"role": role, "module": module, "action": action}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, params=params, headers=self._headers())
                response.raise_for_status()
                data = response.json()
                return bool(data.get("allowed", False))
            except httpx.HTTPError as exc:
                raise CoreServiceError(
                    f"Authorization check failed on core service: {exc}"
                ) from exc
