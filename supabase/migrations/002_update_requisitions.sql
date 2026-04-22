-- Update requisitions table to support guest/staff submissions
-- This allows any staff member to submit requisitions without needing full system access

-- Add missing columns
ALTER TABLE requisitions
ADD COLUMN IF NOT EXISTS requested_by_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update the requested_by column to be optional (allow name-based submissions)
ALTER TABLE requisitions
ALTER COLUMN requested_by DROP NOT NULL;

-- Make description and total_amount usable alongside existing columns
-- total_amount will hold the actual total, total_estimated can be kept for reference

-- Create a more permissive policy for requisition creation
-- This allows any authenticated user to create requisitions
DROP POLICY IF EXISTS "Requisitions creatable by all authenticated" ON requisitions;
CREATE POLICY "Requisitions creatable by all authenticated" ON requisitions
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow anonymous requisition creation for staff without full access
-- Note: In production, you'd want to add some form of verification
DROP POLICY IF EXISTS "Requisitions viewable by authenticated" ON requisitions;
CREATE POLICY "Requisitions viewable by authenticated" ON requisitions
    FOR SELECT TO authenticated USING (true);

-- Allow admins to update/delete requisitions
DROP POLICY IF EXISTS "Requisitions editable by admins" ON requisitions;
CREATE POLICY "Requisitions editable by admins" ON requisitions
    FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Requisitions deletable by admins or creator" ON requisitions
    FOR DELETE TO authenticated USING (
        is_admin(auth.uid()) OR
        requested_by IN (SELECT staff_id FROM user_roles WHERE user_id = auth.uid()) OR
        status = 'pending'
    );
