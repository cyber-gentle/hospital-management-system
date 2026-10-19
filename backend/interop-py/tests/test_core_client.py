"""Tests for the core-service client boundary.

These use httpx's mock transport: they verify that the client builds the right
request and translates failures correctly. They do NOT prove the Go service
actually serves these routes -- that is covered by test_cross_service.py, which
runs the real client against the real service (see the cross-service integration
test requirement in AGENTS.md).
"""

import json
from typing import Callable

import httpx
import pytest

from clients.core_client import AuditLogPayload, CoreServiceClient, CoreServiceError

BASE_URL = "http://mock-go:8080"
INTERNAL_KEY = "test_key"


@pytest.fixture
def client() -> CoreServiceClient:
    return CoreServiceClient(base_url=BASE_URL, internal_key=INTERNAL_KEY)


def install_transport(
    monkeypatch: pytest.MonkeyPatch,
    handler: Callable[[httpx.Request], httpx.Response],
) -> None:
    """Route the client's HTTP calls through a mock transport."""
    transport = httpx.MockTransport(handler)
    original = httpx.AsyncClient

    def factory(*args: object, **kwargs: object) -> httpx.AsyncClient:
        kwargs["transport"] = transport
        return original(*args, **kwargs)  # type: ignore[arg-type]

    monkeypatch.setattr(httpx, "AsyncClient", factory)


async def test_record_audit_log_sends_expected_request(
    client: CoreServiceClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/internal/audit-log"
        assert request.headers.get("X-Internal-Service-Key") == INTERNAL_KEY
        assert request.headers.get("Content-Type") == "application/json"

        body = json.loads(request.content)
        assert body["module"] == "laboratory"
        assert body["action"] == "CREATE_SPECIMEN"
        assert body["resource_id"] == "spec_123"
        assert body["details"] == {"test_type": "Full Blood Count"}

        return httpx.Response(201, json={"status": "recorded", "service": "core-go"})

    install_transport(monkeypatch, handler)

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

    assert await client.record_audit_log(payload) is True


async def test_record_audit_log_raises_when_core_rejects(
    client: CoreServiceClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A refused audit write must surface as an error, never as success."""
    install_transport(monkeypatch, lambda request: httpx.Response(500, json={"error": "boom"}))

    payload = AuditLogPayload(
        module="laboratory",
        action="CREATE_SPECIMEN",
        resource_type="Specimen",
        resource_id="spec_123",
    )

    with pytest.raises(CoreServiceError):
        await client.record_audit_log(payload)


async def test_record_audit_log_raises_when_core_unreachable(
    client: CoreServiceClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    install_transport(monkeypatch, handler)

    payload = AuditLogPayload(
        module="laboratory",
        action="CREATE_SPECIMEN",
        resource_type="Specimen",
        resource_id="spec_123",
    )

    with pytest.raises(CoreServiceError):
        await client.record_audit_log(payload)


async def test_check_authorization_allowed(
    client: CoreServiceClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/internal/authz/check"
        assert request.url.params["role"] == "LAB_SCIENTIST"
        assert request.url.params["module"] == "laboratory"
        assert request.url.params["action"] == "sign_result"
        return httpx.Response(200, json={"allowed": True, "role": "LAB_SCIENTIST"})

    install_transport(monkeypatch, handler)

    assert await client.check_authorization("LAB_SCIENTIST", "laboratory", "sign_result") is True


async def test_check_authorization_denied(
    client: CoreServiceClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    install_transport(
        monkeypatch, lambda request: httpx.Response(200, json={"allowed": False})
    )

    assert await client.check_authorization("NURSE", "laboratory", "sign_result") is False


async def test_unreachable_authority_raises_rather_than_denying(
    client: CoreServiceClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """An unreachable authority must raise. Returning False would be equally
    safe, but raising keeps the distinction between 'denied' and 'cannot tell'
    visible to the caller."""

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    install_transport(monkeypatch, handler)

    with pytest.raises(CoreServiceError):
        await client.check_authorization("LAB_SCIENTIST", "laboratory", "sign_result")


@pytest.mark.parametrize(
    ("base_url", "internal_key"),
    [("", INTERNAL_KEY), (BASE_URL, "")],
)
def test_constructor_requires_url_and_key(base_url: str, internal_key: str) -> None:
    """The client must not construct itself with a missing or defaulted key."""
    with pytest.raises(ValueError):
        CoreServiceClient(base_url=base_url, internal_key=internal_key)
