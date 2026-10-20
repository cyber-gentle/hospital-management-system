import uuid
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient

# We assume that the database and main app are accessible for tests.
# These tests would require the database to be up and running.

@pytest.fixture
def mock_token():
    return "test_token"

import uuid

import pytest
from fastapi.testclient import TestClient

from main import app

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
    
    test_db.execute(text(f"INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, department) VALUES ('{user_id}', 'testuser_{user_id[:8]}', '{user_id[:8]}@test.com', 'hash', 'Test', 'User', 'ADMIN', 'IT')"))
    test_db.execute(text(f"INSERT INTO patients (id, hospital_number, first_name, last_name, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, payment_category) VALUES ('{patient_id}', 'HOSP-{patient_id[:8]}', 'Test', 'Patient', '1990-01-01', 'M', '123 Test St', 'Emerg', '123', 'Friend', 'CASH')"))
    test_db.commit()
    
    yield {"user_id": user_id, "patient_id": patient_id}
    
    # We don't delete immediately because cascade might be needed or we just leave it as test data
    # (Since it's a dev database, leaving it is safer than risking foreign key violations on teardown if our test created dependent rows)

@pytest.fixture
def mock_auth_override(setup_fk_data):
    from auth.jwt import TokenClaims
    from modules.laboratory.router import verify_token
    
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

    from modules.laboratory.router import core_client
    monkeypatch.setattr(core_client, "check_authorization", mock_check_auth)
    monkeypatch.setattr(core_client, "record_audit_log", mock_record_audit)


client = TestClient(app)

def test_laboratory_catalog(mock_auth_override, mock_core_client):
    # Test catalog creation
    response = client.post(
        "/api/v1/laboratory/catalog",
        json={
            "test_code": f"TEST-{uuid.uuid4().hex[:6]}",
            "test_name": "Complete Blood Count",
            "category": "Haematology",
            "price": "15.00"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["test_name"] == "Complete Blood Count"
    assert data["price"] == "15.00"
    
    catalog_id = data["id"]
    
    # Test fetching catalog
    response = client.get("/api/v1/laboratory/catalog")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    
    # Test creating request
    response = client.post(
        "/api/v1/laboratory/requests",
        json={
            "patient_id": mock_auth_override["patient_id"],
            "test_catalog_ids": [catalog_id]
        }
    )
    assert response.status_code == 201
    req_data = response.json()
    assert req_data["status"] == "PENDING"
    req_id = req_data["id"]
    
    # Test updating request status to SAMPLE_COLLECTED
    response = client.put(f"/api/v1/laboratory/requests/{req_id}/sample")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

