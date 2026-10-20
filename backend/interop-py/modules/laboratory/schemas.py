from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid

from pydantic import BaseModel, Field

class LabTestCatalogCreate(BaseModel):
    test_code: str = Field(..., max_length=50)
    test_name: str = Field(..., max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    price: Decimal

class LabTestCatalogResponse(LabTestCatalogCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class LabRequestCreate(BaseModel):
    patient_id: uuid.UUID
    consultation_id: Optional[uuid.UUID] = None
    test_catalog_ids: list[uuid.UUID]

class LabRequestResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    consultation_id: Optional[uuid.UUID]
    requested_by: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LabResultUpdate(BaseModel):
    result_value: str
    reference_range: Optional[str] = None

