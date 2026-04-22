-- Add academic_year and term to fee_payments for per-term tracking
-- This allows payments to be associated with specific terms/years

-- Add columns to fee_payments
ALTER TABLE fee_payments
ADD COLUMN IF NOT EXISTS academic_year VARCHAR(10),
ADD COLUMN IF NOT EXISTS term INTEGER CHECK (term BETWEEN 1 AND 3);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_fee_payments_year_term ON fee_payments(academic_year, term);

-- Drop old trigger that doesn't work properly
DROP TRIGGER IF EXISTS update_balance_on_payment ON fee_payments;
DROP FUNCTION IF EXISTS update_balance_after_payment();

-- Create improved function to update/create student balance after payment
CREATE OR REPLACE FUNCTION update_balance_after_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if academic_year and term are provided
    IF NEW.academic_year IS NOT NULL AND NEW.term IS NOT NULL THEN
        -- Try to update existing balance record
        UPDATE student_balances
        SET amount_paid = amount_paid + NEW.amount,
            updated_at = NOW()
        WHERE student_id = NEW.student_id
        AND category_id = NEW.category_id
        AND academic_year = NEW.academic_year
        AND term = NEW.term;

        -- If no row was updated, create a new balance record
        IF NOT FOUND THEN
            INSERT INTO student_balances (student_id, category_id, academic_year, term, amount_due, amount_paid)
            VALUES (
                NEW.student_id,
                NEW.category_id,
                NEW.academic_year,
                NEW.term,
                COALESCE((SELECT default_amount FROM fee_categories WHERE id = NEW.category_id), 0),
                NEW.amount
            )
            ON CONFLICT (student_id, category_id, academic_year, term)
            DO UPDATE SET amount_paid = student_balances.amount_paid + NEW.amount, updated_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER update_balance_on_payment
    AFTER INSERT ON fee_payments
    FOR EACH ROW EXECUTE FUNCTION update_balance_after_payment();

-- Function to set up term fees for a student (call this to initialize balances)
CREATE OR REPLACE FUNCTION setup_student_term_fees(
    p_student_id UUID,
    p_academic_year VARCHAR(10),
    p_term INTEGER
)
RETURNS void AS $$
BEGIN
    -- Insert balance records for all fee categories that have a default amount
    INSERT INTO student_balances (student_id, category_id, academic_year, term, amount_due, amount_paid)
    SELECT
        p_student_id,
        id,
        p_academic_year,
        p_term,
        COALESCE(default_amount, 0),
        0
    FROM fee_categories
    WHERE default_amount IS NOT NULL AND default_amount > 0
    ON CONFLICT (student_id, category_id, academic_year, term) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to set up term fees for all enrolled students
CREATE OR REPLACE FUNCTION setup_all_students_term_fees(
    p_academic_year VARCHAR(10),
    p_term INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    student_count INTEGER := 0;
    student_rec RECORD;
BEGIN
    FOR student_rec IN SELECT id FROM students WHERE status = 'enrolled' LOOP
        PERFORM setup_student_term_fees(student_rec.id, p_academic_year, p_term);
        student_count := student_count + 1;
    END LOOP;

    RETURN student_count;
END;
$$ LANGUAGE plpgsql;
