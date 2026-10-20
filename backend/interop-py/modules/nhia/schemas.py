import uuid
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

# HMO Provider Schemas
class HMOProviderBase(BaseModel):
    name: str
    code: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True

class HMOProviderCreate(HMOProviderBase):
    pass

class HMOProviderUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None

class HMOProviderResponse(HMOProviderBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# HMO Claim Schemas
class HMOClaimBase(BaseModel):
    hmo_provider_id: uuid.UUID
    invoice_id: uuid.UUID
    patient_id: uuid.UUID
    claim_amount: Decimal

class HMOClaimCreate(HMOClaimBase):
    pass

class HMOClaimUpdate(BaseModel):
    status: Optional[str] = None
    approved_amount: Optional[Decimal] = None
    remarks: Optional[str] = None
    claim_reference: Optional[str] = None

class HMOClaimResponse(HMOClaimBase):
    id: uuid.UUID
    claim_reference: Optional[str] = None
    approved_amount: Optional[Decimal] = None
    status: str
    submission_date: Optional[datetime] = None
    response_date: Optional[datetime] = None
    remarks: Optional[str] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class BatchClaimResponse(BaseModel):
    claim_ids: List[uuid.UUID]
    status: str
    remarks: Optional[str] = None

