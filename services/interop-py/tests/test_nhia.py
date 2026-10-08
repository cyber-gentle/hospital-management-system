import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

from sqlalchemy import text

@pytest.fixture
def test_db():
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def setup_fk_data(test_db):
    user_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())
    invoice_id = str(uuid.uuid4())
    
    test_db.execute(text(f"INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, department) VALUES ('{user_id}', 'testuser_{user_id[:8]}', '{user_id[:8]}@test.com', 'hash', 'Test', 'User', 'ADMIN', 'IT')"))
    test_db.execute(text(f"INSERT INTO patients (id, hospital_number, first_name, last_name, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, payment_category) VALUES ('{patient_id}', 'HOSP-{patient_id[:8]}', 'Test', 'Patient', '1990-01-01', 'M', '123 Test St', 'Emerg', '123', 'Friend', 'CASH')"))
    test_db.execute(text(f"INSERT INTO invoices (id, invoice_number, patient_id, created_by) VALUES ('{invoice_id}', 'INV-{invoice_id[:8]}', '{patient_id}', '{user_id}')"))
    test_db.commit()
    
    yield {"user_id": user_id, "patient_id": patient_id, "invoice_id": invoice_id}

@pytest.fixture
def mock_auth_override(setup_fk_data):
    from auth.jwt import TokenClaims
    from modules.nhia.router import verify_token
    
    async def override_verify():
        return TokenClaims(user_id=setup_fk_data["user_id"], username="testuser", role="ADMIN", department="DEPT")
    
    app.dependency_overrides[verify_token] = override_verify
    yield setup_fk_data
    app.dependency_overrides.clear()

@pytest.fixture
def mock_core_client(monkeypatch):
    async def mock_check_auth(*args, **kwargs):
        return True

    async def mock_record_audit(*args, **kwargs):
        return True

    from modules.nhia.router import core_client
    monkeypatch.setattr(core_client, "check_authorization", mock_check_auth)
    monkeypatch.setattr(core_client, "record_audit_log", mock_record_audit)


def test_nhia_provider_and_claims(mock_auth_override, mock_core_client):
    # Test provider creation
    response = client.post(
        "/api/v1/nhia/providers",
        json={
            "name": "Hygeia HMO",
            "code": f"HYG-{uuid.uuid4().hex[:4]}",
            "contact_person": "Jane Doe",
            "phone": "08012345678"
        }
    )
    assert response.status_code == 201
    provider_data = response.json()
    assert provider_data["name"] == "Hygeia HMO"
    provider_id = provider_data["id"]
    
    # Test creating a claim
    invoice_id = mock_auth_override["invoice_id"]
    patient_id = mock_auth_override["patient_id"]
    
    response = client.post(
        "/api/v1/nhia/claims",
        json={
            "hmo_provider_id": provider_id,
            "invoice_id": invoice_id,
            "patient_id": patient_id,
            "claim_amount": "5000.00"
        }
    )
    assert response.status_code == 201
    claim_data = response.json()
    assert claim_data["status"] == "PENDING"
    assert claim_data["claim_amount"] == "5000.00"
    claim_id = claim_data["id"]
    
    # Test updating claim status
    response = client.put(
        f"/api/v1/nhia/claims/{claim_id}",
        json={
            "status": "APPROVED",
            "approved_amount": "4500.00",
            "remarks": "Deducted 500 for non-covered item"
        }
    )
    assert response.status_code == 200
    update_data = response.json()
    assert update_data["status"] == "APPROVED"
    assert update_data["approved_amount"] == "4500.00"
    
    # Test batch update
    claim_id2 = client.post(
        "/api/v1/nhia/claims",
        json={
            "hmo_provider_id": provider_id,
            "invoice_id": invoice_id,
            "patient_id": patient_id,
            "claim_amount": "2000.00"
        }
    ).json()["id"]
    
    response = client.post(
        "/api/v1/nhia/claims/batch-update",
        json={
            "claim_ids": [claim_id, claim_id2],
            "status": "SUBMITTED",
            "remarks": "Batch submission"
        }
    )
    assert response.status_code == 200
    assert response.json()["updated_count"] == 2

