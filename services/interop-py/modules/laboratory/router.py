import uuid
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.jwt import TokenClaims, TokenVerifier
from clients.core_client import AuditLogPayload, CoreServiceClient, CoreServiceError
from config import get_settings
from database import get_db
from modules.laboratory import models, schemas

settings = get_settings()
router = APIRouter(prefix="/api/v1/laboratory", tags=["Laboratory"])
verify_token = TokenVerifier(settings.jwt_secret)
core_client = CoreServiceClient(
    base_url=settings.core_service_url,
    internal_key=settings.internal_service_key,
)

async def check_permissions(user: TokenClaims, action: str):
    try:
        is_allowed = await core_client.check_authorization(
            role=user.role,
            module="laboratory",
            action=action,
            user_id=user.user_id,
        )
    except CoreServiceError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authorization service unavailable",
        ) from err

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: role is not authorized for laboratory:{action}",
        )

async def log_audit(user: TokenClaims, action: str, resource_type: str, resource_id: str, status_msg: str, details: dict):
    audit_entry = AuditLogPayload(
        user_id=user.user_id,
        user_name=user.username,
        user_role=user.role,
        module="laboratory",
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        status=status_msg,
    )
    try:
        await core_client.record_audit_log(audit_entry)
    except CoreServiceError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Audit logging unavailable; the action was not completed",
        ) from err


@router.post("/catalog", response_model=schemas.LabTestCatalogResponse, status_code=status.HTTP_201_CREATED)
async def create_test_catalog(
    catalog: schemas.LabTestCatalogCreate,
    db: Session = Depends(get_db),
    user: TokenClaims = Depends(verify_token),
):
    await check_permissions(user, "write")
    
    db_item = models.LabTestCatalog(**catalog.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    await log_audit(user, "CREATE_CATALOG", "LabTestCatalog", str(db_item.id), "SUCCESS", catalog.model_dump(mode="json"))
    return db_item

@router.get("/catalog", response_model=List[schemas.LabTestCatalogResponse])
async def list_test_catalog(
    db: Session = Depends(get_db),
    user: TokenClaims = Depends(verify_token),
):
    await check_permissions(user, "read")
    return db.query(models.LabTestCatalog).filter(models.LabTestCatalog.deleted_at.is_(None)).all()

@router.post("/requests", response_model=schemas.LabRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_request(
    request: schemas.LabRequestCreate,
    db: Session = Depends(get_db),
    user: TokenClaims = Depends(verify_token),
):
    await check_permissions(user, "write")
    
    db_request = models.LabRequest(
        patient_id=request.patient_id,
        consultation_id=request.consultation_id,
        requested_by=uuid.UUID(user.user_id),
        status="PENDING"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    for catalog_id in request.test_catalog_ids:
        db_result = models.LabResult(
            lab_request_id=db_request.id,
            test_catalog_id=catalog_id,
            result_status="PENDING"
        )
        db.add(db_result)
        
    db.commit()
    
    await log_audit(user, "CREATE_REQUEST", "LabRequest", str(db_request.id), "SUCCESS", request.model_dump(mode="json"))
    return db_request

@router.put("/requests/{request_id}/sample", status_code=status.HTTP_200_OK)
async def mark_sample_collected(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: TokenClaims = Depends(verify_token),
):
    await check_permissions(user, "write")
    
    db_request = db.query(models.LabRequest).filter(models.LabRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    db_request.status = "SAMPLE_COLLECTED"
    db.commit()
    
    await log_audit(user, "UPDATE_REQUEST_STATUS", "LabRequest", str(db_request.id), "SUCCESS", {"status": "SAMPLE_COLLECTED"})
    return {"status": "success", "request_id": str(request_id)}

@router.put("/results/{result_id}/verify", status_code=status.HTTP_200_OK)
async def verify_result(
    result_id: uuid.UUID,
    result_update: schemas.LabResultUpdate,
    db: Session = Depends(get_db),
    user: TokenClaims = Depends(verify_token),
):
    await check_permissions(user, "write")
    
    db_result = db.query(models.LabResult).filter(models.LabResult.id == result_id).first()
    if not db_result:
        raise HTTPException(status_code=404, detail="Result not found")
        
    db_result.result_value = result_update.result_value
    db_result.reference_range = result_update.reference_range
    db_result.performed_by = uuid.UUID(user.user_id)
    db_result.result_status = "VERIFIED"
    db.commit()
    
    await log_audit(user, "VERIFY_RESULT", "LabResult", str(db_result.id), "SUCCESS", result_update.model_dump(mode="json"))
    return {"status": "success", "result_id": str(result_id)}

