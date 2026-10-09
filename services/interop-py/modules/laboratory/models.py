import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from database import Base

class LabTestCatalog(Base):
    __tablename__ = "lab_test_catalog"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_code = Column(String(50), unique=True, nullable=False)
    test_name = Column(String(255), nullable=False)
    category = Column(String(100))
    price = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

class LabRequest(Base):
    __tablename__ = "lab_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), nullable=False)
    consultation_id = Column(UUID(as_uuid=True), nullable=True)
    requested_by = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(50), default="PENDING")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lab_request_id = Column(UUID(as_uuid=True), ForeignKey("lab_requests.id"), nullable=False)
    test_catalog_id = Column(UUID(as_uuid=True), ForeignKey("lab_test_catalog.id"), nullable=False)
    result_value = Column(String, nullable=True)
    reference_range = Column(String(255), nullable=True)
    performed_by = Column(UUID(as_uuid=True), nullable=True)
    result_status = Column(String(50), default="PENDING")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

