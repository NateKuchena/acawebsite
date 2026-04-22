-- Fix RLS policies to allow authenticated users to manage data
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Staff editable by admins" ON staff;
DROP POLICY IF EXISTS "Staff viewable by admins and self" ON staff;
DROP POLICY IF EXISTS "Students editable by admins" ON students;
DROP POLICY IF EXISTS "Students viewable by staff" ON students;
DROP POLICY IF EXISTS "Assets editable by admins" ON assets;
DROP POLICY IF EXISTS "Fee categories editable by admins" ON fee_categories;
DROP POLICY IF EXISTS "Fee payments editable by staff" ON fee_payments;
DROP POLICY IF EXISTS "Balances editable by staff" ON student_balances;
DROP POLICY IF EXISTS "Benefits editable by admins" ON staff_benefits;
DROP POLICY IF EXISTS "Payroll editable by admins" ON payroll;
DROP POLICY IF EXISTS "Expense categories editable by admins" ON expense_categories;
DROP POLICY IF EXISTS "Payment vouchers editable by admins" ON payment_vouchers;
DROP POLICY IF EXISTS "Other income editable by admins" ON other_income;
DROP POLICY IF EXISTS "Uniforms editable by staff" ON uniforms;
DROP POLICY IF EXISTS "Uniform sales editable by staff" ON uniform_sales;
DROP POLICY IF EXISTS "Marks editable by teachers and admins" ON student_marks;
DROP POLICY IF EXISTS "Disciplinary editable by staff" ON disciplinary_records;
DROP POLICY IF EXISTS "Parent links editable by admins" ON parent_student_links;
DROP POLICY IF EXISTS "Roles editable by admins" ON user_roles;
DROP POLICY IF EXISTS "Bank accounts editable by admins" ON bank_accounts;
DROP POLICY IF EXISTS "School info editable by admins" ON school_info;

-- Create permissive policies for authenticated users
-- Staff table
CREATE POLICY "Staff full access for authenticated" ON staff
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Students table
CREATE POLICY "Students full access for authenticated" ON students
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Assets table
CREATE POLICY "Assets full access for authenticated" ON assets
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fee categories
CREATE POLICY "Fee categories full access for authenticated" ON fee_categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fee payments
CREATE POLICY "Fee payments full access for authenticated" ON fee_payments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Student balances
CREATE POLICY "Balances full access for authenticated" ON student_balances
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Staff benefits
CREATE POLICY "Benefits full access for authenticated" ON staff_benefits
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payroll
CREATE POLICY "Payroll full access for authenticated" ON payroll
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expense categories
CREATE POLICY "Expense categories full access for authenticated" ON expense_categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payment vouchers
CREATE POLICY "Payment vouchers full access for authenticated" ON payment_vouchers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Other income
CREATE POLICY "Other income full access for authenticated" ON other_income
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Uniforms
CREATE POLICY "Uniforms full access for authenticated" ON uniforms
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Uniform sales
CREATE POLICY "Uniform sales full access for authenticated" ON uniform_sales
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Student marks
CREATE POLICY "Marks full access for authenticated" ON student_marks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Disciplinary records
CREATE POLICY "Disciplinary full access for authenticated" ON disciplinary_records
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Parent student links
CREATE POLICY "Parent links full access for authenticated" ON parent_student_links
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User roles
CREATE POLICY "Roles full access for authenticated" ON user_roles
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bank accounts
CREATE POLICY "Bank accounts full access for authenticated" ON bank_accounts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- School info
CREATE POLICY "School info full access for authenticated" ON school_info
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Performance appraisals
DROP POLICY IF EXISTS "Appraisals editable by admins" ON performance_appraisals;
CREATE POLICY "Appraisals full access for authenticated" ON performance_appraisals
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Staff disciplinary records
DROP POLICY IF EXISTS "Staff disciplinary editable by admins" ON staff_disciplinary_records;
CREATE POLICY "Staff disciplinary full access for authenticated" ON staff_disciplinary_records
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Requisitions - fix existing policies
DROP POLICY IF EXISTS "Requisitions editable by admins" ON requisitions;
DROP POLICY IF EXISTS "Requisitions creatable by all authenticated" ON requisitions;
DROP POLICY IF EXISTS "Requisitions viewable by authenticated" ON requisitions;
CREATE POLICY "Requisitions full access for authenticated" ON requisitions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
