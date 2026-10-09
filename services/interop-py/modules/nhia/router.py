import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.jwt import TokenClaims, TokenVerifier
from clients.audited_transaction import commit_audited
from clients.core_client import AuditLogPayload, CoreServiceClient, CoreServiceError
from config import get_settings
from database import get_db
from modules.nhia import models, schemas

settings = get_settings()
router = APIRouter(prefix="/api/v1/nhia", tags=["NHIA_HMO"])
verify_token = TokenVerifier(settings.jwt_secret)
core_client = CoreServiceClient(
    base_url=settings.core_service_url,
    internal_key=settings.internal_service_key,
)

async def check_permissions(user: TokenClaims, action: str) -> None:
    try:
        is_allowed = await core_client.check_authorization(
            role=user.role,
            module="nhia",
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
            detail=f"Forbidden: role is not authorized for nhia:{action}",
        )

async def log_audit(db: Session, user: TokenClaims, action: str, resource_type: str, resource_id: str, status_msg: str, details: dict[str, object]) -> None:
    audit_entry = AuditLogPayload(
        user_id=user.user_id,
        user_name=user.username,
        user_role=user.role,
        module="nhia",
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        status=status_msg,
    )
    try:
        await commit_audited(db, core_client, audit_entry)
    except CoreServiceError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Audit logging unavailable; the action was not completed",
        ) from err

@router.post("/providers", response_model=schemas.HMOProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_hmo_provider(
    provider: schemas.HMOProviderCreate,
    db: Session = Depends(get_db),
    user: TokenClaims = Depends(verify_token),
):
    await check_permissions(user, "write")
    
    db_provider = models.HMOProvider(**provider.model_dump())
    db.add(db_provider)
    db.flush()
    db.refresh(db_provider)
    
    await log_audit(db, user, "CREATE_PROVIDER", "HMOProvider", str(db_provider.id), "SUCCESS", provider.model_dump(mode="json"))
    return db_provider

@router.get("/providers", response_model=List[schemas.HMOProviderResponse])
async def list_hmo_providers(
    db: Session = Depends(get_db),
    user: TokenClaims = Depends(verify_token),
):
    await check_permissions(user, "read")
    return db.query(models.HMOProvider).filter(models.HMOProvider.deleted_at.is_(None)).all()

@router.post("/claims", response_model=schemas.HMOClaimResponse, status_code=status.HTTP_201_CREATED)
async def create_hmo_claim(
    claim: schemas.HMOClaimCreate,
    db: Session = Depends(get_db),
    user: TokenClaims = Depends(verify_token),
):
    await check_permissions(user, "write")
    
    db_claim = models.HMOClaim(
        **claim.model_dump(),
        created_by=uuid.UUID(user.user_id)
    )
    db.add(db_claim)
    db.flush()
    db.refresh(db_claim)
    
    await log_audit(db, user, "CREATE_CLAIM", "HMOClaim", str(db_claim.id), "SUCCESS", {"claim_amount": str(claim.claim_amount)})
    return db_claim

@router.put("/claims/{claim_id}", response_model=schemas.HMOClaimResponse)
async def update_hmo_claim_status(
    claim_id: uuid.UUID,
    claim_update: schemas.HMOClaimUpdate,
    db: Session = Depends(get_db),
    user: TokenClaims = Depends(verify_token),
):
    await check_permissions(user, "write")
    
    db_claim = db.query(models.HMOClaim).filter(models.HMOClaim.id == claim_id, models.HMOClaim.deleted_at.is_(None)).with_for_update().first()
    if not db_claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    update_data = claim_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_claim, key, value)
        
    if claim_update.status == "SUBMITTED" and db_claim.submission_date is None:
        db_claim.submission_date = datetime.now(timezone.utc)
    elif claim_update.status in ["APPROVED", "REJECTED", "PARTIAL"] and db_claim.response_date is None:
        db_claim.response_date = datetime.now(timezone.utc)
        
    db.flush()
    db.refresh(db_claim)
    
    audit_details = {k: str(v) if v is not None else None for k, v in update_data.items()}
    await log_audit(db, user, "UPDATE_CLAIM", "HMOClaim", str(db_claim.id), "SUCCESS", audit_details)
    return db_claim

@router.post("/claims/batch-update", status_code=status.HTTP_200_OK)
async def batch_update_claims(
    batch_update: schemas.BatchClaimResponse,
    db: Session = Depends(get_db),
    user: TokenClaims = Depends(verify_token),
):
    await check_permissions(user, "write")
    
    claims = db.query(models.HMOClaim).filter(models.HMOClaim.id.in_(batch_update.claim_ids), models.HMOClaim.deleted_at.is_(None)).with_for_update().all()
    if not claims:
        raise HTTPException(status_code=404, detail="No valid claims found")
        
    updated_ids = []
    for claim in claims:
        claim.status = batch_update.status
        if batch_update.remarks:
            claim.remarks = batch_update.remarks
            
        if batch_update.status == "SUBMITTED" and claim.submission_date is None:
            claim.submission_date = datetime.now(timezone.utc)
        elif batch_update.status in ["APPROVED", "REJECTED", "PARTIAL"] and claim.response_date is None:
            claim.response_date = datetime.now(timezone.utc)
            
        updated_ids.append(str(claim.id))
            
    db.flush()
    
    await log_audit(
        db, user, "BATCH_UPDATE_CLAIMS", "HMOClaim", "batch", "SUCCESS",
        {"updated_claims": updated_ids, "new_status": batch_update.status}
    )
    return {"status": "success", "updated_count": len(updated_ids)}
