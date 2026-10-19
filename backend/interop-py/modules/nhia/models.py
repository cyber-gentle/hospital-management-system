import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from database import Base

def utcnow():
    return datetime.now(timezone.utc)

class HMOProvider(Base):
    __tablename__ = "hmo_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    contact_person = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

class HMOClaim(Base):
    __tablename__ = "hmo_claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hmo_provider_id = Column(UUID(as_uuid=True), ForeignKey("hmo_providers.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), nullable=False) # References core-go invoices table
    patient_id = Column(UUID(as_uuid=True), nullable=False) # References core-go patients table
    
    claim_reference = Column(String(100), unique=True, nullable=True)
    claim_amount = Column(Numeric(12, 2), nullable=False)
    approved_amount = Column(Numeric(12, 2), nullable=True)
    status = Column(String(50), nullable=False, default="PENDING")
    
    submission_date = Column(DateTime(timezone=True), nullable=True)
    response_date = Column(DateTime(timezone=True), nullable=True)
    remarks = Column(Text, nullable=True)
    
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

