-- Allocate identifiers independently of wall-clock timing. Legacy identifiers
-- remain unchanged; the next value starts above their largest numeric suffix.
CREATE SEQUENCE hospital_number_sequence;
SELECT setval('hospital_number_sequence', GREATEST(1, COALESCE((SELECT MAX(substring(hospital_number FROM '([0-9]+)$')::bigint) + 1 FROM patients WHERE hospital_number ~ '^HIMS-[0-9]{4}-[0-9]+$'), 1)), false);
CREATE SEQUENCE financial_number_sequence;
SELECT setval('financial_number_sequence', GREATEST(1, COALESCE((SELECT MAX(number) + 1 FROM (
    SELECT substring(invoice_number FROM '([0-9]+)$')::bigint AS number FROM invoices WHERE invoice_number ~ '^INV-[0-9]{4}-[0-9]+$'
    UNION ALL
    SELECT substring(receipt_number FROM '([0-9]+)$')::bigint FROM payments WHERE receipt_number ~ '^(RCP|REC|DEP)-[0-9]{4}-[0-9]+$'
) existing), 1)), false);
