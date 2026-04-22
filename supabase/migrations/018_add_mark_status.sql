-- Add mark_status column for special mark entries (Absent, Not Written)
-- This allows marks to be null when student was absent or didn't submit work

-- Add mark_status column
ALTER TABLE student_marks
ADD COLUMN IF NOT EXISTS mark_status VARCHAR(10) DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN student_marks.mark_status IS 'Special mark status: A = Absent, NW = Not Written. When set, mark can be null.';

-- Make mark column nullable (if not already)
ALTER TABLE student_marks
ALTER COLUMN mark DROP NOT NULL;

-- Add index for filtering by mark_status
CREATE INDEX IF NOT EXISTS idx_student_marks_status ON student_marks(mark_status) WHERE mark_status IS NOT NULL;
