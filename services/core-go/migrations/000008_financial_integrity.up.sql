-- FR-AC-01/07: reject invalid monetary state even for non-HTTP writers.
-- NOT VALID preserves existing deployments without rewriting financial data.
-- PostgreSQL enforces these checks on all new/updated rows; operators must
-- review legacy violations before a later VALIDATE CONSTRAINT migration.
ALTER TABLE wallets ADD CONSTRAINT wallets_balance_nonnegative CHECK (balance >= 0) NOT VALID;
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_amount_positive CHECK (amount > 0) NOT VALID;
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_valid_type CHECK (transaction_type IN ('CREDIT', 'DEBIT')) NOT VALID;
ALTER TABLE payments ADD CONSTRAINT payments_amount_positive CHECK (amount_paid > 0) NOT VALID;
ALTER TABLE admission_deposits ADD CONSTRAINT admission_deposits_valid_amounts CHECK (paid_amount >= 0 AND required_amount >= 0) NOT VALID;
ALTER TABLE invoices ADD CONSTRAINT invoices_valid_amounts CHECK (
    subtotal >= 0 AND tax >= 0 AND discount >= 0 AND nhia_coverage >= 0
    AND total_amount >= 0 AND paid_amount >= 0 AND balance_due >= 0
    AND nhia_coverage <= total_amount
) NOT VALID;
ALTER TABLE invoice_line_items ADD CONSTRAINT invoice_line_items_valid_amounts CHECK (
    quantity > 0 AND unit_price >= 0 AND total_price >= 0
    AND nhia_covered_amount >= 0 AND nhia_covered_amount <= total_price
    AND patient_payable_amount >= 0
) NOT VALID;

-- Durable idempotency for authenticated gateway events. Kept separate from
-- human-entered teller/receipt references, which need not be globally unique.
CREATE TABLE wallet_webhook_events (
    reference VARCHAR(100) PRIMARY KEY,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    transaction_id UUID REFERENCES wallet_transactions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
