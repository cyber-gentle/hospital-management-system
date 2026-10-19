import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth.jwt import TokenClaims, TokenVerifier
from clients.core_client import AuditLogPayload, CoreServiceClient, CoreServiceError
from clients.audited_transaction import commit_audited
from config import get_settings
from database import get_db
from . import models, schemas

settings = get_settings()
router = APIRouter(prefix="/api/v1/radiology", tags=["radiology"])
verify_token = TokenVerifier(settings.jwt_secret)
core_client = CoreServiceClient(
    base_url=settings.core_service_url,
    internal_key=settings.internal_service_key,
)

async def check_permissions(claims: TokenClaims, action: str) -> None:
    try:
        allowed = await core_client.check_authorization(claims.role, "radiology", action, claims.user_id, claims.token_version, claims.session_id)
    except CoreServiceError as exc:
        raise HTTPException(503, "Authorization service unavailable") from exc
    if not allowed:
        raise HTTPException(403, "Forbidden: radiology permission required")

@router.post("/catalog", response_model=schemas.RadiologyCatalogResponse, status_code=201)
async def create_catalog_item(
    item: schemas.RadiologyCatalogCreate,
    db: Session = Depends(get_db),
    claims: TokenClaims = Depends(verify_token)
):
    await check_permissions(claims, "write")
    
    db_item = models.RadiologyCatalog(**item.model_dump())
    db.add(db_item)
    db.flush()
    
    audit_entry = AuditLogPayload(
        user_id=claims.user_id,
        user_name=claims.username,
        user_role=claims.role,
        module="radiology",
        action="CREATE_RADIOLOGY_CATALOG",
        resource_type="RadiologyCatalog",
        resource_id=str(db_item.id),
        details={"exam_name": db_item.exam_name}
    )
    await commit_audited(db, core_client, audit_entry)
    db.refresh(db_item)
    
    return db_item

@router.get("/catalog", response_model=List[schemas.RadiologyCatalogResponse])
async def list_catalog(
    db: Session = Depends(get_db),
    claims: TokenClaims = Depends(verify_token)
):
    await check_permissions(claims, "read")
    return db.query(models.RadiologyCatalog).filter(models.RadiologyCatalog.deleted_at.is_(None)).all()

@router.post("/requests", response_model=schemas.RadiologyRequestResponse, status_code=201)
async def create_request(
    req: schemas.RadiologyRequestCreate,
    db: Session = Depends(get_db),
    claims: TokenClaims = Depends(verify_token)
):
    await check_permissions(claims, "write")
    
    catalog = db.query(models.RadiologyCatalog).filter(models.RadiologyCatalog.id == req.catalog_id, models.RadiologyCatalog.deleted_at.is_(None)).with_for_update(read=True).first()
    patient = db.execute(text("SELECT id FROM patients WHERE id=:patient_id AND deleted_at IS NULL FOR SHARE"), {"patient_id":str(req.patient_id)}).first()
    if catalog is None or patient is None:
        raise HTTPException(404, "Active patient or imaging examination not found")
    db_req = models.RadiologyRequest(
        **req.model_dump(),
        requested_by=uuid.UUID(claims.user_id)
    )
    db.add(db_req)
    db.flush()
    
    audit_entry = AuditLogPayload(
        user_id=claims.user_id,
        user_name=claims.username,
        user_role=claims.role,
        module="radiology",
        action="CREATE_RADIOLOGY_REQUEST",
        resource_type="RadiologyRequest",
        resource_id=str(db_req.id),
        details={"patient_id": str(db_req.patient_id)}
    )
    await commit_audited(db, core_client, audit_entry)
    db.refresh(db_req)
    
    return db_req

@router.put("/requests/{request_id}", response_model=schemas.RadiologyRequestResponse)
async def update_request(
    request_id: uuid.UUID,
    update_data: schemas.RadiologyRequestUpdate,
    db: Session = Depends(get_db),
    claims: TokenClaims = Depends(verify_token)
):
    await check_permissions(claims, "write")
    
    db_req = db.query(models.RadiologyRequest).filter(models.RadiologyRequest.id == request_id, models.RadiologyRequest.deleted_at.is_(None)).with_for_update().first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    changes = update_data.model_dump(exclude_unset=True)
    if "radiologist_id" in changes and str(changes["radiologist_id"]) != claims.user_id:
        raise HTTPException(403, "Report author must be the authenticated user")
    if "status" in changes and changes["status"] is None:
        raise HTTPException(422, "Status cannot be null")
    resulting_report = changes.get("report_text", db_req.report_text)
    resulting_status = changes.get("status", db_req.status)
    if resulting_status == models.RadiologyRequestStatus.COMPLETED and not (resulting_report and resulting_report.strip()):
        raise HTTPException(422, "A completed study requires a recorded report")
    if "report_text" in changes:
        changes["radiologist_id"] = uuid.UUID(claims.user_id)
    for key, value in changes.items():
        setattr(db_req, key, value)
        
    db.flush()
    
    audit_entry = AuditLogPayload(
        user_id=claims.user_id,
        user_name=claims.username,
        user_role=claims.role,
        module="radiology",
        action="UPDATE_RADIOLOGY_REQUEST",
        resource_type="RadiologyRequest",
        resource_id=str(db_req.id),
        details={"status": db_req.status}
    )
    await commit_audited(db, core_client, audit_entry)
    db.refresh(db_req)
    
    return db_req


@router.get("/requests", response_model=List[schemas.RadiologyRequestResponse])
async def list_requests(
    patient_id: uuid.UUID | None = None,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    claims: TokenClaims = Depends(verify_token),
) -> list[models.RadiologyRequest]:
    await check_permissions(claims, "read")
    query = db.query(models.RadiologyRequest).filter(models.RadiologyRequest.deleted_at.is_(None))
    if patient_id is not None:
        query = query.filter(models.RadiologyRequest.patient_id == patient_id)
    return query.order_by(models.RadiologyRequest.created_at.desc(), models.RadiologyRequest.id.desc()).offset(offset).limit(limit).all()
