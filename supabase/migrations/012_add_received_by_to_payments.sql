-- =============================================
-- ADD RECEIVED_BY_NAME TO FEE PAYMENTS
-- Track who received/recorded the payment
-- Note: received_by may already exist as UUID, so we use received_by_name for text
-- =============================================

ALTER TABLE fee_payments
ADD COLUMN IF NOT EXISTS received_by_name VARCHAR(255);

COMMENT ON COLUMN fee_payments.received_by_name IS 'Name of the staff member who received/recorded the payment';
