-- =============================================
-- ADD ACCOUNTABILITY FIELDS
-- Track who paid out vouchers and approved requisitions
-- =============================================

-- Add paid_by_name to payment_vouchers (stores the name of who paid out)
-- Note: paid_by already exists as UUID, so we use paid_by_name for the text name
ALTER TABLE payment_vouchers
ADD COLUMN IF NOT EXISTS paid_by_name VARCHAR(255);

-- Add approved_by_name to requisitions (stores the name of who approved)
ALTER TABLE requisitions
ADD COLUMN IF NOT EXISTS approved_by_name VARCHAR(255);

COMMENT ON COLUMN payment_vouchers.paid_by_name IS 'Name of the staff member who processed the payment';
COMMENT ON COLUMN requisitions.approved_by_name IS 'Name of the staff member who approved the requisition';
