import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from main import app
from sqlalchemy import text

client = TestClient(app)

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
    
    test_db.execute(text(f"INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, department) VALUES ('{user_id}', 'testuser_{user_id[:8]}', '{user_id[:8]}@test.com', 'hash', 'Test', 'User', 'RADIOLOGIST', 'RADIOLOGY')"))
    test_db.execute(text(f"INSERT INTO patients (id, hospital_number, first_name, last_name, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, payment_category) VALUES ('{patient_id}', 'HOSP-{patient_id[:8]}', 'Test', 'Patient', '1990-01-01', 'M', '123 Test St', 'Emerg', '123', 'Friend', 'CASH')"))
    test_db.commit()
    
    yield {"user_id": user_id, "patient_id": patient_id}

@pytest.fixture
def mock_auth_override(setup_fk_data):
    from auth.jwt import TokenClaims
    from modules.radiology.router import verify_token
    
    async def override_verify():
        return TokenClaims(user_id=setup_fk_data["user_id"], username="testuser", role="RADIOLOGIST", department="DEPT")
    
    app.dependency_overrides[verify_token] = override_verify
    yield setup_fk_data
    app.dependency_overrides.clear()

@pytest.fixture
def mock_core_client(monkeypatch):
    async def mock_check_auth(*args, **kwargs):
        return True

    async def mock_record_audit(*args, **kwargs):
        return True

    from modules.radiology.router import core_client
    monkeypatch.setattr(core_client, "check_authorization", mock_check_auth)
    monkeypatch.setattr(core_client, "record_audit_log", mock_record_audit)


def test_radiology_flow(mock_auth_override, mock_core_client):
    # Test catalog creation
    response = client.post(
        "/api/v1/radiology/catalog",
        json={
            "modality": "XRAY",
            "exam_name": "Chest PA",
            "price": "100.00"
        }
    )
    assert response.status_code == 201
    catalog_data = response.json()
    assert catalog_data["exam_name"] == "Chest PA"
    catalog_id = catalog_data["id"]

    # Test create request
    patient_id = mock_auth_override["patient_id"]
    response = client.post(
        "/api/v1/radiology/requests",
        json={
            "patient_id": patient_id,
            "catalog_id": catalog_id
        }
    )
    assert response.status_code == 201
    req_data = response.json()
    assert req_data["status"] == "PENDING"
    req_id = req_data["id"]

    # Test update request (add report & DICOM uid)
    response = client.put(
        f"/api/v1/radiology/requests/{req_id}",
        json={
            "status": "COMPLETED",
            "report_text": "No acute cardiopulmonary abnormalities.",
            "dicom_study_uid": "1.2.3.4.5.6.7.8",
            "radiologist_id": mock_auth_override["user_id"]
        }
    )
    assert response.status_code == 200
    update_data = response.json()
    assert update_data["status"] == "COMPLETED"
    assert update_data["report_text"] == "No acute cardiopulmonary abnormalities."
    assert update_data["dicom_study_uid"] == "1.2.3.4.5.6.7.8"
