-- Allow multiple payment records per receipt (for multi-category payments)
-- This enables recording multiple fee categories on a single receipt

-- Remove the UNIQUE constraint on receipt_number
ALTER TABLE fee_payments DROP CONSTRAINT IF EXISTS fee_payments_receipt_number_key;

-- Create an index for faster receipt lookups (without uniqueness)
CREATE INDEX IF NOT EXISTS idx_fee_payments_receipt_number ON fee_payments(receipt_number);
