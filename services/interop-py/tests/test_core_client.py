import pytest
import httpx
from clients.core_client import CoreServiceClient, AuditLogPayload


@pytest.mark.asyncio
async def test_record_audit_log_success():
    async def mock_handler(request: httpx.Request):
        assert request.url.path == "/internal/audit-log"
        assert request.headers.get("X-Internal-Service-Key") == "test_key"
        assert request.headers.get("Content-Type") == "application/json"
        
        # Verify body
        import json
        body = json.loads(request.content)
        assert body["module"] == "laboratory"
        assert body["action"] == "CREATE_SPECIMEN"
        assert body["resource_id"] == "spec_123"

        return httpx.Response(201, json={"status": "recorded", "service": "core-go"})

    transport = httpx.MockTransport(mock_handler)
    client = CoreServiceClient(base_url="http://mock-go:8080", internal_key="test_key")

    # Patch client to use mock transport
    original_client = httpx.AsyncClient

    def get_mock_client(*args, **kwargs):
        kwargs["transport"] = transport
        return original_client(*args, **kwargs)

    httpx.AsyncClient = get_mock_client
    try:
        payload = AuditLogPayload(
            user_id="usr_lab_01",
            user_name="Lab Tech John",
            user_role="LAB_SCIENTIST",
            module="laboratory",
            action="CREATE_SPECIMEN",
            resource_type="Specimen",
            resource_id="spec_123",
            details={"test_type": "Full Blood Count"},
        )
        success = await client.record_audit_log(payload)
        assert success is True
    finally:
        httpx.AsyncClient = original_client


@pytest.mark.asyncio
async def test_check_authorization_allowed():
    async def mock_handler(request: httpx.Request):
        assert request.url.path == "/internal/authz/check"
        assert request.url.params["role"] == "LAB_SCIENTIST"
        assert request.url.params["module"] == "laboratory"
        assert request.url.params["action"] == "sign_result"
        return httpx.Response(200, json={"allowed": True, "role": "LAB_SCIENTIST"})

    transport = httpx.MockTransport(mock_handler)
    client = CoreServiceClient(base_url="http://mock-go:8080", internal_key="test_key")

    original_client = httpx.AsyncClient

    def get_mock_client(*args, **kwargs):
        kwargs["transport"] = transport
        return original_client(*args, **kwargs)

    httpx.AsyncClient = get_mock_client
    try:
        allowed = await client.check_authorization("LAB_SCIENTIST", "laboratory", "sign_result")
        assert allowed is True
    finally:
        httpx.AsyncClient = original_client
