-- Fix staff_benefits table to match frontend expectations
-- The table was incorrectly recreated in migration 003

DROP TABLE IF EXISTS employee_benefits CASCADE;
DROP TABLE IF EXISTS staff_benefits CASCADE;

CREATE TABLE staff_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL,
    provider VARCHAR(100),
    policy_number VARCHAR(100),
    monthly_amount DECIMAL(10,2),
    employer_contribution DECIMAL(10,2),
    employee_contribution DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff benefits full access for authenticated" ON staff_benefits
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_staff_benefits_staff_id ON staff_benefits(staff_id);
