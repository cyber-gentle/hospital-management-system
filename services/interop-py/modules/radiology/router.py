import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.jwt import TokenClaims, TokenVerifier
from clients.core_client import AuditLogPayload, CoreServiceClient, CoreServiceError
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

@router.post("/catalog", response_model=schemas.RadiologyCatalogResponse, status_code=201)
async def create_catalog_item(
    item: schemas.RadiologyCatalogCreate,
    db: Session = Depends(get_db),
    claims: TokenClaims = Depends(verify_token)
):
    await core_client.check_authorization(claims.role, "radiology", "write", claims.user_id)
    
    db_item = models.RadiologyCatalog(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
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
    await core_client.record_audit_log(audit_entry)
    
    return db_item

@router.get("/catalog", response_model=List[schemas.RadiologyCatalogResponse])
async def list_catalog(
    db: Session = Depends(get_db),
    claims: TokenClaims = Depends(verify_token)
):
    await core_client.check_authorization(claims.role, "radiology", "read", claims.user_id)
    return db.query(models.RadiologyCatalog).all()

@router.post("/requests", response_model=schemas.RadiologyRequestResponse, status_code=201)
async def create_request(
    req: schemas.RadiologyRequestCreate,
    db: Session = Depends(get_db),
    claims: TokenClaims = Depends(verify_token)
):
    await core_client.check_authorization(claims.role, "radiology", "write", claims.user_id)
    
    db_req = models.RadiologyRequest(
        **req.model_dump(),
        requested_by=uuid.UUID(claims.user_id)
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    
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
    await core_client.record_audit_log(audit_entry)
    
    return db_req

@router.put("/requests/{request_id}", response_model=schemas.RadiologyRequestResponse)
async def update_request(
    request_id: str,
    update_data: schemas.RadiologyRequestUpdate,
    db: Session = Depends(get_db),
    claims: TokenClaims = Depends(verify_token)
):
    await core_client.check_authorization(claims.role, "radiology", "write", claims.user_id)
    
    db_req = db.query(models.RadiologyRequest).filter(models.RadiologyRequest.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(db_req, key, value)
        
    db.commit()
    db.refresh(db_req)
    
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
    await core_client.record_audit_log(audit_entry)
    
    return db_req
