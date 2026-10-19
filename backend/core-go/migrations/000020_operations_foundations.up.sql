-- Foundations for Go-owned operations modules. Policy-dependent transitions
-- remain disabled until the hospital defines their approval/release rules.
CREATE TABLE hr_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_number VARCHAR(100) NOT NULL UNIQUE,
    profile JSONB NOT NULL CHECK (jsonb_typeof(profile) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE hr_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES hr_staff(id),
    shift_date DATE NOT NULL,
    details JSONB NOT NULL CHECK (jsonb_typeof(details) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX hr_shifts_staff_date ON hr_shifts(staff_id,shift_date) WHERE deleted_at IS NULL;
CREATE TABLE hr_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES hr_staff(id),
    details JSONB NOT NULL CHECK (jsonb_typeof(details) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE central_inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit_of_measure VARCHAR(30) NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK(current_stock >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK(reorder_level >= 0),
    buffer_stock INTEGER NOT NULL DEFAULT 0 CHECK(buffer_stock >= 0),
    unit_cost NUMERIC(12,2) NOT NULL CHECK(unit_cost >= 0),
    location_bin VARCHAR(255) NOT NULL,
    preferred_vendor VARCHAR(255) NOT NULL DEFAULT '',
    last_restocked TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE inventory_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    details JSONB NOT NULL CHECK(jsonb_typeof(details) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE inventory_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(100) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES inventory_vendors(id),
    total_amount NUMERIC(12,2) NOT NULL CHECK(total_amount > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','SUBMITTED_FOR_APPROVAL','APPROVED','PARTIALLY_RECEIVED','FULFILLED','CANCELLED')),
    details JSONB NOT NULL CHECK(jsonb_typeof(details) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE inventory_goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES inventory_purchase_orders(id),
    details JSONB NOT NULL CHECK(jsonb_typeof(details) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE inventory_issuances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    details JSONB NOT NULL CHECK(jsonb_typeof(details) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE mortuary_deceased (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_number VARCHAR(100) NOT NULL UNIQUE,
    daily_rate NUMERIC(12,2) NOT NULL CHECK(daily_rate >= 0),
    details JSONB NOT NULL CHECK(jsonb_typeof(details) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE mortuary_chambers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    details JSONB NOT NULL CHECK(jsonb_typeof(details) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE mortuary_autopsies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deceased_id UUID NOT NULL REFERENCES mortuary_deceased(id),
    details JSONB NOT NULL CHECK(jsonb_typeof(details) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE mortuary_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deceased_id UUID NOT NULL REFERENCES mortuary_deceased(id),
    details JSONB NOT NULL CHECK(jsonb_typeof(details) = 'object'),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE audit_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES audit_logs(id),
    severity VARCHAR(20) NOT NULL CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    detected_rule TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'FLAGGED' CHECK(status IN ('FLAGGED','UNDER_REVIEW','CLEARED','ESCALATED')),
    assigned_auditor UUID REFERENCES users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
-- Register capabilities without choosing or widening the hospital role matrix.
INSERT INTO permissions(id,module,action,description)
SELECT module||':'||action,module,action,'Operations module capability'
FROM (VALUES ('hr'),('inventory'),('mortuary'),('audit')) m(module)
CROSS JOIN (VALUES ('read'),('write'),('approve')) a(action)
ON CONFLICT(id) DO NOTHING;
