"""Cross-service integration tests: the real Python client against the real Go service.

AGENTS.md requires this boundary be covered by a test that exercises the actual
HTTP endpoints -- the existing tests in ``test_core_client.py`` use
``httpx.MockTransport``, which AGENTS.md rules out as "a local stub standing in
permanently". MockTransport proves the client builds the right request; it cannot
prove the Go service serves that path, guards it with the internal key, or
reaches the database. This file covers exactly those three things.

The suite builds and launches the real ``services/core-go`` binary, points a real
``CoreServiceClient`` at it over real HTTP, and inspects PostgreSQL directly to
confirm the audit row landed. It skips (rather than fails) when the Go toolchain
or ``TEST_DATABASE_URL`` is unavailable, so a workstation without them still runs
the unit suite; CI provides both.

Run locally with::

    TEST_DATABASE_URL=postgres://... pytest tests/test_cross_service.py
"""

from __future__ import annotations

import os
import shutil
import socket
import subprocess
import time
import uuid
from pathlib import Path
from typing import Iterator

import httpx
import pytest

from clients.core_client import AuditLogPayload, CoreServiceClient, CoreServiceError

# services/interop-py/tests/test_cross_service.py -> services/
SERVICES_DIR = Path(__file__).resolve().parents[2]
CORE_GO_DIR = SERVICES_DIR / "core-go"

# Long enough to clear config.Load's minimums, and distinct from the placeholder
# values the service refuses to boot with.
TEST_JWT_SECRET = "cross_service_test_jwt_secret_at_least_32_bytes_long"
TEST_INTERNAL_KEY = "cross_service_test_internal_key_0123456789"

STARTUP_TIMEOUT_SECONDS = 60


class CoreService:
    """A running core-go process, addressed over HTTP."""

    def __init__(self, base_url: str, internal_key: str, database_url: str) -> None:
        self.base_url = base_url
        self.internal_key = internal_key
        self.database_url = database_url

    def client(self, internal_key: str | None = None) -> CoreServiceClient:
        return CoreServiceClient(
            base_url=self.base_url,
            internal_key=internal_key or self.internal_key,
        )


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _wait_until_healthy(base_url: str, process: subprocess.Popen[str]) -> None:
    deadline = time.monotonic() + STARTUP_TIMEOUT_SECONDS

    while time.monotonic() < deadline:
        if process.poll() is not None:
            output = process.stdout.read() if process.stdout else ""
            raise RuntimeError(
                f"core-go exited with status {process.returncode} before becoming "
                f"healthy:\n{output}"
            )
        try:
            response = httpx.get(f"{base_url}/health", timeout=2.0)
            if response.status_code == 200:
                return
        except httpx.HTTPError:
            pass
        time.sleep(0.25)

    raise RuntimeError(f"core-go did not become healthy within {STARTUP_TIMEOUT_SECONDS}s")


@pytest.fixture(scope="session")
def core_service(tmp_path_factory: pytest.TempPathFactory) -> Iterator[CoreService]:
    """Build and run the real core-go service against the test database."""
    database_url = os.environ.get("TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("TEST_DATABASE_URL is not set; skipping the cross-service test")

    if shutil.which("go") is None:
        pytest.skip("the Go toolchain is not available to build the core service")

    binary = tmp_path_factory.mktemp("core-go") / "server"

    build = subprocess.run(
        ["go", "build", "-o", str(binary), "./cmd/server"],
        cwd=CORE_GO_DIR,
        capture_output=True,
        text=True,
    )
    if build.returncode != 0:
        raise RuntimeError(f"failed to build core-go:\n{build.stderr}")

    port = _free_port()
    base_url = f"http://127.0.0.1:{port}"

    environment = {
        **os.environ,
        "PORT": str(port),
        "DATABASE_URL": database_url,
        "JWT_SECRET": TEST_JWT_SECRET,
        "INTERNAL_SERVICE_KEY": TEST_INTERNAL_KEY,
    }

    process = subprocess.Popen(
        [str(binary)],
        cwd=CORE_GO_DIR,
        env=environment,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    try:
        _wait_until_healthy(base_url, process)
    except Exception:
        process.kill()
        process.wait(timeout=10)
        raise

    try:
        yield CoreService(base_url, TEST_INTERNAL_KEY, database_url)
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)


@pytest.fixture
def db(core_service: CoreService):
    """A direct PostgreSQL connection, for checking what the Go service wrote."""
    psycopg2 = pytest.importorskip("psycopg2")

    connection = psycopg2.connect(core_service.database_url)
    connection.autocommit = True
    try:
        yield connection
    finally:
        connection.close()


# ---------------------------------------------------------------------------
# The internal-key guard is real
# ---------------------------------------------------------------------------


async def test_audit_log_endpoint_is_guarded_by_the_internal_key(
    core_service: CoreService,
) -> None:
    """A wrong key must be refused by the real endpoint.

    Asserting on the status code rather than just "an error was raised" matters:
    401 proves the route exists and rejected the caller, whereas 404 would mean
    the client is posting to a path the service does not serve -- the exact class
    of drift this test exists to catch.
    """
    payload = AuditLogPayload(
        module="laboratory",
        action="CREATE_SPECIMEN",
        resource_type="Specimen",
        resource_id=f"cross_key_{uuid.uuid4().hex}",
    )

    async with httpx.AsyncClient(timeout=5.0) as raw:
        response = await raw.post(
            f"{core_service.base_url}/internal/audit-log",
            json=payload.model_dump(exclude_none=True),
            headers={"X-Internal-Service-Key": "definitely-not-the-key"},
        )

    assert response.status_code == 401, (
        f"expected the internal route to reject a bad key with 401, got "
        f"{response.status_code} (a 404 would mean the path is wrong)"
    )


async def test_authz_endpoint_is_guarded_by_the_internal_key(
    core_service: CoreService,
) -> None:
    async with httpx.AsyncClient(timeout=5.0) as raw:
        response = await raw.get(
            f"{core_service.base_url}/internal/authz/check",
            params={"role": "NURSE", "module": "nursing", "action": "view"},
            headers={"X-Internal-Service-Key": "definitely-not-the-key"},
        )

    assert response.status_code == 401


async def test_client_reports_a_refused_key_as_an_error(core_service: CoreService) -> None:
    """The client must surface a rejection rather than swallow it."""
    client = core_service.client(internal_key="definitely-not-the-key")

    with pytest.raises(CoreServiceError):
        await client.record_audit_log(
            AuditLogPayload(
                module="laboratory",
                action="CREATE_SPECIMEN",
                resource_type="Specimen",
                resource_id=f"cross_key_{uuid.uuid4().hex}",
            )
        )


# ---------------------------------------------------------------------------
# The audit-log endpoint actually writes a row
# ---------------------------------------------------------------------------


async def test_record_audit_log_persists_a_row(core_service: CoreService, db) -> None:
    """The full path: Python client -> HTTP -> Go handler -> PostgreSQL."""
    client = core_service.client()
    resource_id = f"cross_audit_{uuid.uuid4().hex}"

    recorded = await client.record_audit_log(
        AuditLogPayload(
            user_name="cross_service_test",
            user_role="LAB_SCIENTIST",
            module="laboratory",
            action="CREATE_SPECIMEN",
            resource_type="Specimen",
            resource_id=resource_id,
            details={"test_type": "Malaria Parasite", "priority": "urgent"},
        )
    )
    assert recorded is True

    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT service, module, action, resource_type, user_name, user_role, details, status
            FROM audit_logs
            WHERE resource_id = %s
            """,
            (resource_id,),
        )
        rows = cursor.fetchall()

    assert len(rows) == 1, f"expected exactly one audit row, found {len(rows)}"

    service, module, action, resource_type, user_name, user_role, details, status = rows[0]
    assert service == "interop-py", "the Go service must attribute Python-originated entries"
    assert module == "laboratory"
    assert action == "CREATE_SPECIMEN"
    assert resource_type == "Specimen"
    assert user_name == "cross_service_test"
    assert user_role == "LAB_SCIENTIST"
    assert status == "SUCCESS"
    assert details["test_type"] == "Malaria Parasite"


async def test_audit_rows_written_through_the_api_cannot_be_altered(
    core_service: CoreService, db
) -> None:
    """The append-only guarantee holds for rows that arrive over HTTP.

    test_writer_integration_test.go proves the trigger fires for direct SQL; this
    proves the same guarantee applies to the path Python actually uses.
    """
    client = core_service.client()
    resource_id = f"cross_immutable_{uuid.uuid4().hex}"

    await client.record_audit_log(
        AuditLogPayload(
            module="radiology",
            action="CREATE_IMAGING_REQUEST",
            resource_type="ImagingRequest",
            resource_id=resource_id,
        )
    )

    with pytest.raises(Exception):
        with db.cursor() as cursor:
            cursor.execute(
                "UPDATE audit_logs SET action = 'TAMPERED' WHERE resource_id = %s",
                (resource_id,),
            )

    with db.cursor() as cursor:
        cursor.execute(
            "SELECT action FROM audit_logs WHERE resource_id = %s", (resource_id,)
        )
        assert cursor.fetchone()[0] == "CREATE_IMAGING_REQUEST"


# ---------------------------------------------------------------------------
# The authz endpoint answers from the database, not the fallback matrix
# ---------------------------------------------------------------------------


async def test_authz_check_answers_from_the_database(core_service: CoreService, db) -> None:
    """A permission granted only in role_permissions must be honoured.

    NURSE is not granted the laboratory module by the Go handler's fallback
    matrix, so a True answer can only have come from the role_permissions table.
    That is what proves the Python client is reaching the authoritative matrix
    rather than a second implementation of the rules.
    """
    permission_id = "laboratory:view"
    role = f"NURSE_{uuid.uuid4().hex[:8].upper()}"

    with db.cursor() as cursor:
        # The role is unique per run, so this row cannot collide with real data.
        cursor.execute(
            "INSERT INTO permissions (id, module, action, description) VALUES (%s, %s, %s, %s)",
            (permission_id, "laboratory", "view", "cross-service test fixture"),
        )
        cursor.execute(
            "INSERT INTO role_permissions (role, permission_id) VALUES (%s, %s) "
            "ON CONFLICT DO NOTHING",
            (role, permission_id),
        )

    try:
        assert (
            await core_service.client().check_authorization(role, "laboratory", "view")
            is True
        )
        # A permission the row does not cover must still be denied.
        assert (
            await core_service.client().check_authorization(role, "laboratory", "delete")
            is False
        )
    finally:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM role_permissions WHERE role = %s", (role,))
            cursor.execute("DELETE FROM permissions WHERE id = %s", (permission_id,))


async def test_authz_check_denies_an_unknown_role(core_service: CoreService) -> None:
    """An unknown role gets no access -- the fail-closed default."""
    client = core_service.client()

    assert await client.check_authorization("NOT_A_REAL_ROLE", "nursing", "view") is False


async def test_authz_check_grants_the_admin_override(core_service: CoreService) -> None:
    """ADMIN keeps universal access through the real endpoint."""
    client = core_service.client()

    assert await client.check_authorization("ADMIN", "laboratory", "delete") is True
