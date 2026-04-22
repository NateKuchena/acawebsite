-- =============================================
-- ADDITIONAL TABLES AND UPDATES
-- Version: 1.1
-- =============================================

-- =============================================
-- EMPLOYEES TABLE (Extended Staff)
-- =============================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    national_id VARCHAR(50),
    address TEXT,
    department VARCHAR(100),
    position VARCHAR(100),
    employment_type VARCHAR(50) DEFAULT 'permanent', -- permanent, contract, temporary
    hire_date DATE,
    basic_salary DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    qualifications TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees viewable by authenticated" ON employees
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Employees editable by authenticated" ON employees
    FOR ALL TO authenticated USING (true);

-- =============================================
-- SUBJECTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    department VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects viewable by authenticated" ON subjects
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Subjects editable by authenticated" ON subjects
    FOR ALL TO authenticated USING (true);

-- =============================================
-- UNIFORM ITEMS TABLE (Updated)
-- =============================================

CREATE TABLE IF NOT EXISTS uniform_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    size VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uniform_items_name ON uniform_items(name);

ALTER TABLE uniform_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Uniform items viewable by authenticated" ON uniform_items
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Uniform items editable by authenticated" ON uniform_items
    FOR ALL TO authenticated USING (true);

-- =============================================
-- STAFF BENEFITS (Standalone - for benefit types)
-- =============================================

-- Drop and recreate if different structure needed
DROP TABLE IF EXISTS staff_benefits CASCADE;

CREATE TABLE staff_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'allowance' or 'deduction'
    amount DECIMAL(10,2),
    is_percentage BOOLEAN DEFAULT false,
    is_taxable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff benefits viewable by authenticated" ON staff_benefits
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff benefits editable by authenticated" ON staff_benefits
    FOR ALL TO authenticated USING (true);

-- =============================================
-- EMPLOYEE BENEFITS (Link table)
-- =============================================

CREATE TABLE IF NOT EXISTS employee_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    benefit_id UUID REFERENCES staff_benefits(id) ON DELETE CASCADE,
    custom_amount DECIMAL(10,2), -- Override default amount if needed
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, benefit_id)
);

ALTER TABLE employee_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employee benefits viewable by authenticated" ON employee_benefits
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Employee benefits editable by authenticated" ON employee_benefits
    FOR ALL TO authenticated USING (true);

-- =============================================
-- UPDATE FEE CATEGORIES (Add missing columns)
-- =============================================

ALTER TABLE fee_categories
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- =============================================
-- UPDATE STUDENTS TABLE (Add missing columns)
-- =============================================

ALTER TABLE students
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS stream VARCHAR(20),
ADD COLUMN IF NOT EXISTS admission_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(150),
ADD COLUMN IF NOT EXISTS medical_info TEXT,
ADD COLUMN IF NOT EXISTS previous_school VARCHAR(200);

-- =============================================
-- UPDATE ASSETS TABLE (Add missing columns)
-- =============================================

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS supplier VARCHAR(200),
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'good';

-- =============================================
-- UPDATE REQUISITIONS (Add missing columns)
-- =============================================

ALTER TABLE requisitions
ADD COLUMN IF NOT EXISTS notes TEXT;

-- =============================================
-- UPDATE PAYMENT VOUCHERS (Add missing columns)
-- =============================================

ALTER TABLE payment_vouchers
ADD COLUMN IF NOT EXISTS payee VARCHAR(200),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS prepared_by VARCHAR(200),
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(200),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);

-- =============================================
-- UPDATE OTHER INCOME (Add missing columns)
-- =============================================

ALTER TABLE other_income
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- =============================================
-- UPDATE FEE PAYMENTS (Add missing columns)
-- =============================================

ALTER TABLE fee_payments
ADD COLUMN IF NOT EXISTS fee_category_id UUID REFERENCES fee_categories(id);

-- =============================================
-- UPDATE STUDENT BALANCES (Add fee_category reference)
-- =============================================

ALTER TABLE student_balances
ADD COLUMN IF NOT EXISTS fee_category_id UUID REFERENCES fee_categories(id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_uniform_items_updated_at
    BEFORE UPDATE ON uniform_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
