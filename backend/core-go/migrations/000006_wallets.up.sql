CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    hospital_number VARCHAR(50) NOT NULL UNIQUE,
    virtual_account_number VARCHAR(20) NOT NULL UNIQUE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'CREDIT' or 'DEBIT'
    amount DECIMAL(12, 2) NOT NULL,
    reference VARCHAR(100) NOT NULL, -- Receipt Number, Invoice Number, or Gateway Trx ID
    processed_by VARCHAR(100) NOT NULL, -- UUID of Cashier OR 'SYSTEM_WEBHOOK'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger function to auto-create wallet upon patient registration
CREATE OR REPLACE FUNCTION auto_create_patient_wallet()
RETURNS TRIGGER AS $$
DECLARE
    -- Extract only numbers from the hospital_number (e.g. HIMS-2026-00123 -> 202600123)
    -- and pad it to 10 digits to mimic standard Virtual Account NUBAN format
    numeric_only VARCHAR;
    virtual_acc VARCHAR;
BEGIN
    numeric_only := regexp_replace(NEW.hospital_number, '\D', '', 'g');
    virtual_acc := lpad(numeric_only, 10, '0');
    
    -- If the hospital number produces a duplicate (very unlikely due to sequence), 
    -- we handle it by appending random digits or just letting it throw for now.
    -- Assuming hospital_number is unique, numeric_only should be unique in this context.
    
    INSERT INTO wallets (patient_id, hospital_number, virtual_account_number, balance)
    VALUES (NEW.id, NEW.hospital_number, virtual_acc, 0.00);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to patients table
CREATE TRIGGER trigger_auto_create_wallet
AFTER INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION auto_create_patient_wallet();
