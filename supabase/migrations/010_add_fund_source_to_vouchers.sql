-- =============================================
-- ADD FUND SOURCE TO PAYMENT VOUCHERS
-- This allows tracking which fee category funds
-- are being used for each expense
-- =============================================

-- Add fund_source_id column to payment_vouchers
ALTER TABLE payment_vouchers
ADD COLUMN IF NOT EXISTS fund_source_id UUID REFERENCES fee_categories(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_vouchers_fund_source ON payment_vouchers(fund_source_id);

-- Add comment for documentation
COMMENT ON COLUMN payment_vouchers.fund_source_id IS 'References the fee category from which funds are drawn for this expense';
