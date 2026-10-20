from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError

from clients.audited_transaction import commit_audited
from clients.core_client import AuditLogPayload, CoreServiceError


def entry() -> AuditLogPayload:
    return AuditLogPayload(module="laboratory", action="CREATE_CATALOG", resource_type="LabTestCatalog", resource_id="synthetic")


@pytest.mark.parametrize("failure", [CoreServiceError("synthetic outage"), False])
async def test_audit_failure_rolls_back_without_committing(failure: object) -> None:
    db = Mock()
    client = Mock()
    client.record_audit_log = AsyncMock(side_effect=failure) if isinstance(failure, Exception) else AsyncMock(return_value=failure)
    with pytest.raises(HTTPException) as caught:
        await commit_audited(db, client, entry())
    assert caught.value.status_code == 503
    db.rollback.assert_called_once()
    db.commit.assert_not_called()


async def test_database_flush_failure_never_records_success() -> None:
    db = Mock()
    db.flush.side_effect = SQLAlchemyError("synthetic constraint")
    client = Mock(record_audit_log=AsyncMock())
    with pytest.raises(HTTPException):
        await commit_audited(db, client, entry())
    db.rollback.assert_called_once()
    db.commit.assert_not_called()
    client.record_audit_log.assert_not_awaited()


async def test_commit_failure_appends_failure_to_the_existing_audit() -> None:
    db = Mock()
    db.commit.side_effect = SQLAlchemyError("synthetic commit failure")
    client = Mock(record_audit_log=AsyncMock(return_value=True))
    with pytest.raises(HTTPException):
        await commit_audited(db, client, entry())
    db.rollback.assert_called_once()
    entries = [call.args[0] for call in client.record_audit_log.await_args_list]
    assert [payload.status for payload in entries] == ["SUCCESS", "FAILURE"]
    assert entries[0].details["commit_phase"] == "before_database_commit"
    assert entries[1].details["commit_phase"] == "database_commit_failed"
