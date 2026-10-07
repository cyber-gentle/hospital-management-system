from pydantic import BaseModel, ConfigDict, UUID4
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from .models import RadiologyRequestStatus

class RadiologyCatalogBase(BaseModel):
    modality: str
    exam_name: str
    price: Decimal

class RadiologyCatalogCreate(RadiologyCatalogBase):
    pass

class RadiologyCatalogResponse(RadiologyCatalogBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class RadiologyRequestBase(BaseModel):
    patient_id: UUID4
    catalog_id: UUID4

class RadiologyRequestCreate(RadiologyRequestBase):
    pass

class RadiologyRequestUpdate(BaseModel):
    status: Optional[RadiologyRequestStatus] = None
    report_text: Optional[str] = None
    dicom_study_uid: Optional[str] = None
    radiologist_id: Optional[UUID4] = None

class RadiologyRequestResponse(RadiologyRequestBase):
    id: UUID4
    status: RadiologyRequestStatus
    report_text: Optional[str] = None
    dicom_study_uid: Optional[str] = None
    requested_by: UUID4
    radiologist_id: Optional[UUID4] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
