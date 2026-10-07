import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Numeric, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from database import Base

class RadiologyRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class RadiologyCatalog(Base):
    __tablename__ = "radiology_catalog"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    modality = Column(String, nullable=False) # e.g. XRAY, MRI, CT
    exam_name = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class RadiologyRequest(Base):
    __tablename__ = "radiology_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), nullable=False)
    catalog_id = Column(UUID(as_uuid=True), ForeignKey("radiology_catalog.id"), nullable=False)
    status = Column(Enum(RadiologyRequestStatus, name="radiology_request_status_enum", create_type=False), default=RadiologyRequestStatus.PENDING)
    report_text = Column(Text, nullable=True)
    dicom_study_uid = Column(String, nullable=True) # Reference to PACS
    requested_by = Column(UUID(as_uuid=True), nullable=False)
    radiologist_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
