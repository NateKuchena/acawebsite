-- =============================================
-- UNIFORM SALES ENHANCEMENTS
-- Add payment tracking fields to match fee receipts
-- =============================================

-- Add payment method to uniform sales
ALTER TABLE uniform_sales
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';

-- Add received_by_name to track who received the payment
ALTER TABLE uniform_sales
ADD COLUMN IF NOT EXISTS received_by_name VARCHAR(255);

-- Add student form/class reference for receipts
-- (Will be fetched from students table, no need to duplicate)

-- Create index for payment tracking
CREATE INDEX IF NOT EXISTS idx_uniform_sales_payment_method ON uniform_sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_uniform_sales_received_by ON uniform_sales(received_by_name);

-- Add comments
COMMENT ON COLUMN uniform_sales.payment_method IS 'Payment method: cash, bank_transfer, mobile_money, cheque';
COMMENT ON COLUMN uniform_sales.received_by_name IS 'Name of staff who received the payment';
