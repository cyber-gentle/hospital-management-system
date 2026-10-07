CREATE TABLE IF NOT EXISTS sub_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sub_store_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_store_id UUID NOT NULL REFERENCES sub_stores(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    UNIQUE(sub_store_id, item_name)
);

CREATE TABLE IF NOT EXISTS sub_store_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_store_id UUID NOT NULL REFERENCES sub_stores(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, FULFILLED, REJECTED
    notes TEXT,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sub_store_requisition_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id UUID NOT NULL REFERENCES sub_store_requisitions(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity_requested INT NOT NULL,
    quantity_fulfilled INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

