# 05_DATABASE_SCHEMA.md — Database Schema & Data Models
## Hospital Information Management System (HIMS)

> **Document Version:** 1.0.0  
> **Database Engine:** PostgreSQL 16.x  
> **Schema Ownership:** Go Core Service (`services/core-go/migrations/`)  
> **Data Integrity Rules:** No Hard Deletion, Exact Decimal Currency, Immutable Audit Triggers

---

## 1. Global Database Design Conventions

1. **Primary Keys:** `UUID` formatted strings generated via `gen_random_uuid()` or sequential formatted keys (e.g. `HIMS-YYYY-XXXXX`).
2. **Timestamps:** Every table MUST carry `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`. Stored and computed in UTC.
3. **Soft Deletion (`deleted_at`):** Clinical and financial records MUST NEVER be hard-deleted (`DELETE FROM`). A `deleted_at TIMESTAMPTZ DEFAULT NULL` column is required on all mutable domain entities (`AGENTS.md` Rule #3).
4. **Monetary Quantities:** Monetary columns MUST use `NUMERIC(12, 2)` or `NUMERIC(14, 2)`. Native floating-point data types (`FLOAT`, `REAL`, `DOUBLE PRECISION`) are strictly forbidden.
5. **Foreign Key Integrity:** Enforce foreign keys with `ON DELETE RESTRICT` on clinical, audit, and ledger relations.

---

## 2. Core Relational Schema Tables

### 2.1 Security, Users & Append-Only Audit Trail
- **`users`:** Staff credentials, role, department, active status, failed login count, and 2FA settings.
  ```sql
  CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      role VARCHAR(50) NOT NULL,
      department VARCHAR(100) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      failed_login_attempts INT NOT NULL DEFAULT 0,
      two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ
  );
  ```
- **`role_permissions`:** Granular module privileges (`read`, `write`, `approve`, `delete_soft`, `admin_override`).
- **`audit_logs`:** Append-only clinical, financial, and access audit event trail.
  ```sql
  CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      user_id VARCHAR(50),
      user_name VARCHAR(100) NOT NULL,
      user_role VARCHAR(50) NOT NULL,
      action_category VARCHAR(50) NOT NULL,
      module VARCHAR(50) NOT NULL,
      action VARCHAR(100) NOT NULL,
      status VARCHAR(20) NOT NULL, -- SUCCESS | FAILURE | DENIED
      ip_address VARCHAR(45) NOT NULL,
      details JSONB NOT NULL DEFAULT '{}'::jsonb
  );
  ```

### 2.2 Medical Records & Patient Identification
- **`patients`:** Master Patient Index record (hospital number, demographics, address, emergency contact, NHIA scheme).
- **`patient_encounters`:** Clinic visits, triage encounters, and admission linking.

### 2.3 Nursing Services & Wards
- **`wards`:** Ward departments, physical location, bed capacity, and specialty.
- **`beds`:** Individual bed units with occupancy status (`OCCUPIED`, `AVAILABLE`, `MAINTENANCE`).
- **`ward_admissions`:** Inpatient admission episodes, deposit status, primary diagnosis, and discharge status.
- **`vitals_logs`:** Time-series clinical vitals (pulse, BP, temp, SpO2, respiratory rate, GCS).
- **`nursing_notes`:** Progress notes, clinical assessments, and sign-and-lock endorsements.
- **`shift_handovers`:** Dual-nurse ward shift summaries and co-signatures.

### 2.4 Accounts, Billing & General Ledger
- **`invoices`:** Patient bills with tariff line items, discounts, NHIA shares, and status (`PENDING`, `PARTIALLY_PAID`, `PAID`, `CANCELLED`).
- **`invoice_items`:** Individual billable procedure, medication, or bed charge lines.
- **`payments`:** Cashier receipts with payment method (`CASH`, `POS`, `TRANSFER`, `INSURANCE`), receipt number, and cashier ID.
- **`accounts`:** 4-tier Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses).
- **`journal_vouchers`:** Double-entry accounting transactions with debit and credit lines and Chief Accountant approval.

### 2.5 Pharmacy & Inventory Supply Chain
- **`drugs`:** Master pharmaceutical formulary, dosage, strength, reorder levels, and unit tariffs.
- **`drug_batches`:** Physical inventory batches with batch numbers, expiry dates, and current stock balance.
- **`prescriptions`:** Clinical medication orders linked to patient encounters.
- **`inventory_items`:** Central procurement catalog items and stock levels.
- **`purchase_orders`:** Central store vendor purchase orders with approval workflow.
- **`goods_receipts`:** Delivery inspection records (GRN) logging accepted and rejected quantities.

---

## 3. Database Triggers: Enforcing Immutable Audit Logging

To guarantee compliance with `AGENTS.md` Rule #2, database triggers block any modification or deletion of audit logs:

```sql
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_log_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER trg_prevent_audit_log_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
```
