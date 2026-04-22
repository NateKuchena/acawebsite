-- Add collection status to uniform sales
ALTER TABLE uniform_sales
ADD COLUMN IF NOT EXISTS collected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS collected_by VARCHAR(255);

-- Create uniform fund tracking table
CREATE TABLE IF NOT EXISTS uniform_fund_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('sale', 'expense', 'adjustment')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference_id UUID, -- Can reference uniform_sales.id or vouchers.id
    reference_type VARCHAR(50), -- 'uniform_sale' or 'voucher'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- Add uniform_fund option to payment_vouchers for tracking expenses from uniform fund
ALTER TABLE payment_vouchers
ADD COLUMN IF NOT EXISTS fund_source VARCHAR(50) DEFAULT 'general' CHECK (fund_source IN ('general', 'uniform'));

-- Create index for fund transactions
CREATE INDEX IF NOT EXISTS idx_uniform_fund_transactions_type ON uniform_fund_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_uniform_fund_transactions_created ON uniform_fund_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_vouchers_fund_source ON payment_vouchers(fund_source);

-- RLS policies for uniform fund transactions
ALTER TABLE uniform_fund_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view uniform fund transactions"
ON uniform_fund_transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert uniform fund transactions"
ON uniform_fund_transactions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update uniform fund transactions"
ON uniform_fund_transactions FOR UPDATE
TO authenticated
USING (true);
