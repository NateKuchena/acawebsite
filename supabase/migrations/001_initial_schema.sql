-- School Management System Database Schema
-- Version: 1.0
-- Created: December 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE student_status AS ENUM ('enrolled', 'transferred', 'graduated');
CREATE TYPE staff_status AS ENUM ('employed', 'terminated', 'retired');
CREATE TYPE asset_status AS ENUM ('functional', 'missing', 'disposed');
CREATE TYPE requisition_status AS ENUM ('pending', 'approved', 'rejected', 'awaiting_payment', 'paid');

-- ============================================
-- SCHOOL INFO
-- ============================================

CREATE TABLE school_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    logo_url TEXT,
    cash_at_hand DECIMAL(12,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name VARCHAR(100) NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    branch VARCHAR(100),
    balance DECIMAL(12,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF MANAGEMENT
-- ============================================

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    grade VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    next_of_kin_name VARCHAR(200),
    next_of_kin_contact VARCHAR(100),
    religious_denomination VARCHAR(100),
    health_conditions TEXT,
    children_names TEXT[],
    status staff_status DEFAULT 'employed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL,
    provider VARCHAR(100),
    policy_number VARCHAR(100),
    monthly_amount DECIMAL(10,2),
    employer_contribution DECIMAL(10,2),
    employee_contribution DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE performance_appraisals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    appraisal_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    appraiser_id UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff_disciplinary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    offense TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    recorded_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    basic_salary DECIMAL(10,2) NOT NULL,
    allowances JSONB,
    deductions JSONB,
    gross_pay DECIMAL(10,2) NOT NULL,
    net_pay DECIMAL(10,2) NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STUDENT MANAGEMENT
-- ============================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    form VARCHAR(20) NOT NULL,
    guardian_name VARCHAR(200) NOT NULL,
    guardian_contact VARCHAR(100) NOT NULL,
    religious_denomination VARCHAR(100),
    health_conditions TEXT,
    status student_status DEFAULT 'enrolled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(10) NOT NULL,
    term INTEGER NOT NULL CHECK (term BETWEEN 1 AND 3),
    subject VARCHAR(100) NOT NULL,
    mark DECIMAL(5,2),
    grade VARCHAR(5),
    teacher_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE disciplinary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    offense TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    recorded_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FINANCIAL MANAGEMENT
-- ============================================

CREATE TABLE fee_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_amount DECIMAL(10,2),
    academic_year VARCHAR(10),
    term INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    category_id UUID REFERENCES fee_categories(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    received_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    category_id UUID REFERENCES fee_categories(id),
    academic_year VARCHAR(10) NOT NULL,
    term INTEGER NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, category_id, academic_year, term)
);

CREATE TABLE uniforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    sizes TEXT[] NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE uniform_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    uniform_id UUID REFERENCES uniforms(id),
    size VARCHAR(50) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    received_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    requested_by UUID REFERENCES staff(id),
    department VARCHAR(100),
    items JSONB NOT NULL,
    total_estimated DECIMAL(10,2),
    justification TEXT,
    status requisition_status DEFAULT 'pending',
    approved_by UUID REFERENCES staff(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_number VARCHAR(50) UNIQUE NOT NULL,
    requisition_id UUID REFERENCES requisitions(id),
    payee_name VARCHAR(200) NOT NULL,
    purpose TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_category_id UUID REFERENCES expense_categories(id),
    paid_by UUID REFERENCES staff(id),
    payment_method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE other_income (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    source VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    received_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ASSET MANAGEMENT
-- ============================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_number VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    location VARCHAR(200),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),
    status asset_status DEFAULT 'functional',
    is_movable BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER ROLES & AUTHENTICATION
-- ============================================

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    staff_id UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE TABLE parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, student_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_students_student_number ON students(student_number);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_form ON students(form);

CREATE INDEX idx_staff_employee_number ON staff(employee_number);
CREATE INDEX idx_staff_status ON staff(status);

CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_category ON fee_payments(category_id);
CREATE INDEX idx_fee_payments_date ON fee_payments(created_at);

CREATE INDEX idx_student_balances_student ON student_balances(student_id);
CREATE INDEX idx_student_balances_category ON student_balances(category_id);

CREATE INDEX idx_student_marks_student ON student_marks(student_id);
CREATE INDEX idx_student_marks_year_term ON student_marks(academic_year, term);

CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category ON assets(category);

CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_requested_by ON requisitions(requested_by);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_parent_links_user ON parent_student_links(user_id);
CREATE INDEX idx_parent_links_student ON parent_student_links(student_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE school_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_disciplinary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE uniforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE uniform_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Helper function
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid
    AND role IN ('super_admin', 'admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- RLS POLICIES - Staff can view their own data, admins can view all
-- ============================================

-- School Info: Everyone can read, only admins can modify
CREATE POLICY "School info viewable by authenticated" ON school_info
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "School info editable by admins" ON school_info
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Bank Accounts: Only admins
CREATE POLICY "Bank accounts viewable by admins" ON bank_accounts
    FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Bank accounts editable by admins" ON bank_accounts
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Staff: Admins can view/edit all, staff can view own
CREATE POLICY "Staff viewable by admins and self" ON staff
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        id IN (SELECT staff_id FROM user_roles WHERE user_id = auth.uid())
    );
CREATE POLICY "Staff editable by admins" ON staff
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Students: Staff can view, admins can edit, parents can view linked
CREATE POLICY "Students viewable by staff" ON students
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'staff', 'hr')) OR
        id IN (SELECT student_id FROM parent_student_links WHERE user_id = auth.uid())
    );
CREATE POLICY "Students editable by admins" ON students
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Student Marks: Staff can view/add, parents can view linked
CREATE POLICY "Marks viewable by staff and parents" ON student_marks
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'staff')) OR
        student_id IN (SELECT student_id FROM parent_student_links WHERE user_id = auth.uid())
    );
CREATE POLICY "Marks editable by teachers and admins" ON student_marks
    FOR ALL TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'teacher')
    );

-- Fee categories: Everyone can view, admins edit
CREATE POLICY "Fee categories viewable" ON fee_categories
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fee categories editable by admins" ON fee_categories
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Fee payments: Staff can view/add, parents can view linked
CREATE POLICY "Fee payments viewable by staff and parents" ON fee_payments
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('staff', 'teacher')) OR
        student_id IN (SELECT student_id FROM parent_student_links WHERE user_id = auth.uid())
    );
CREATE POLICY "Fee payments editable by staff" ON fee_payments
    FOR ALL TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'staff')
    );

-- Student balances: Similar to fee payments
CREATE POLICY "Balances viewable by staff and parents" ON student_balances
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('staff', 'teacher')) OR
        student_id IN (SELECT student_id FROM parent_student_links WHERE user_id = auth.uid())
    );
CREATE POLICY "Balances editable by staff" ON student_balances
    FOR ALL TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'staff')
    );

-- Requisitions: All staff can create, admins can approve
CREATE POLICY "Requisitions viewable by authenticated" ON requisitions
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        requested_by IN (SELECT staff_id FROM user_roles WHERE user_id = auth.uid())
    );
CREATE POLICY "Requisitions creatable by all authenticated" ON requisitions
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Requisitions editable by admins" ON requisitions
    FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- User roles: Users can see own, admins can manage
CREATE POLICY "Roles viewable by self and admins" ON user_roles
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR is_admin(auth.uid())
    );
CREATE POLICY "Roles editable by admins" ON user_roles
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Parent links: Users can see own, admins can manage
CREATE POLICY "Parent links viewable by self and admins" ON parent_student_links
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR is_admin(auth.uid())
    );
CREATE POLICY "Parent links editable by admins" ON parent_student_links
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Assets: Staff can view, admins can edit
CREATE POLICY "Assets viewable by staff" ON assets
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Assets editable by admins" ON assets
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Uniforms: All can view, staff can edit
CREATE POLICY "Uniforms viewable by all" ON uniforms
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Uniforms editable by staff" ON uniforms
    FOR ALL TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'staff')
    );

-- Uniform sales: Staff can manage
CREATE POLICY "Uniform sales viewable by staff and parents" ON uniform_sales
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'staff') OR
        student_id IN (SELECT student_id FROM parent_student_links WHERE user_id = auth.uid())
    );
CREATE POLICY "Uniform sales editable by staff" ON uniform_sales
    FOR ALL TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'staff')
    );

-- Other tables - admins only for sensitive data
CREATE POLICY "Benefits viewable by self and admins" ON staff_benefits
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        staff_id IN (SELECT staff_id FROM user_roles WHERE user_id = auth.uid())
    );
CREATE POLICY "Benefits editable by admins" ON staff_benefits
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Payroll viewable by self and admins" ON payroll
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        staff_id IN (SELECT staff_id FROM user_roles WHERE user_id = auth.uid())
    );
CREATE POLICY "Payroll editable by admins" ON payroll
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Expense categories viewable" ON expense_categories
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Expense categories editable by admins" ON expense_categories
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Payment vouchers viewable by admins" ON payment_vouchers
    FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Payment vouchers editable by admins" ON payment_vouchers
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Other income viewable by admins" ON other_income
    FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Other income editable by admins" ON other_income
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Appraisals viewable by self and admins" ON performance_appraisals
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        staff_id IN (SELECT staff_id FROM user_roles WHERE user_id = auth.uid())
    );
CREATE POLICY "Appraisals editable by admins" ON performance_appraisals
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Disciplinary viewable by self and admins" ON disciplinary_records
    FOR SELECT TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'staff'))
    );
CREATE POLICY "Disciplinary editable by staff" ON disciplinary_records
    FOR ALL TO authenticated USING (
        is_admin(auth.uid()) OR
        EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'staff'))
    );

CREATE POLICY "Staff disciplinary viewable by admins" ON staff_disciplinary_records
    FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Staff disciplinary editable by admins" ON staff_disciplinary_records
    FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- ============================================
-- FUNCTIONS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_school_info_updated_at
    BEFORE UPDATE ON school_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTION TO GENERATE RECEIPT NUMBERS
-- ============================================

CREATE OR REPLACE FUNCTION generate_receipt_number(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION TO UPDATE STUDENT BALANCE AFTER PAYMENT
-- ============================================

CREATE OR REPLACE FUNCTION update_balance_after_payment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE student_balances
    SET amount_paid = amount_paid + NEW.amount,
        updated_at = NOW()
    WHERE student_id = NEW.student_id
    AND category_id = NEW.category_id
    AND academic_year = (SELECT academic_year FROM fee_categories WHERE id = NEW.category_id)
    AND term = (SELECT term FROM fee_categories WHERE id = NEW.category_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_balance_on_payment
    AFTER INSERT ON fee_payments
    FOR EACH ROW EXECUTE FUNCTION update_balance_after_payment();
