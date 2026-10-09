"""Require the Go audit service to accept an entry before saving a mutation.

This prevents audit outages from leaving unlogged data changes. The HTTP audit
write and the SQL transaction are separate commits: a pre-commit audit entry
does not prove the SQL commit completed. A failed SQL commit gets a compensating
FAILURE entry where the audit service remains reachable.
"""

import logging

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from clients.core_client import AuditLogPayload, CoreServiceClient, CoreServiceError

logger = logging.getLogger(__name__)


async def commit_audited(
    db: Session, client: CoreServiceClient, entry: AuditLogPayload
) -> None:
    entry = entry.model_copy(update={
        "details": {**entry.details, "commit_phase": "before_database_commit"},
    })
    try:
        db.flush()
        if not await client.record_audit_log(entry):
            raise CoreServiceError("Audit service did not acknowledge the entry")
    except CoreServiceError as exc:
        db.rollback()
        raise HTTPException(503, "Audit logging unavailable; the action was not completed") from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, "Database write unavailable; the action was not completed") from exc

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        failure = entry.model_copy(update={
            "status": "FAILURE",
            "details": {**entry.details, "commit_phase": "database_commit_failed"},
        })
        try:
            await client.record_audit_log(failure)
        except CoreServiceError:
            logger.exception("Unable to record failed commit for %s %s", entry.action, entry.resource_id)
        raise HTTPException(503, "Database commit could not be confirmed; review before retrying") from exc
