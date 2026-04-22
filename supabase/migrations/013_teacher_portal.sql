-- =============================================
-- TEACHER PORTAL SUPPORT
-- Add mark_type column and teacher_subjects table
-- =============================================

-- Add mark_type to student_marks for coursework vs exam distinction
ALTER TABLE student_marks
ADD COLUMN IF NOT EXISTS mark_type VARCHAR(50) DEFAULT 'exam';

COMMENT ON COLUMN student_marks.mark_type IS 'Type of mark: exam, coursework, test, practical, assignment';

-- Create teacher_subjects table for optional subject assignments
CREATE TABLE IF NOT EXISTS teacher_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    form VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, subject, form)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_staff ON teacher_subjects(staff_id);
CREATE INDEX IF NOT EXISTS idx_student_marks_mark_type ON student_marks(mark_type);

-- RLS policies for teacher_subjects
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher subjects viewable by authenticated" ON teacher_subjects
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE teacher_subjects IS 'Links teachers to the subjects and forms they teach';
