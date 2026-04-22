-- =============================================
-- ADD COURSEWORK FIELDS TO STUDENT_MARKS
-- Date written, topic, and max score for non-exam marks
-- =============================================

-- Add date_written column
ALTER TABLE student_marks
ADD COLUMN IF NOT EXISTS date_written DATE;

-- Add topic column
ALTER TABLE student_marks
ADD COLUMN IF NOT EXISTS topic VARCHAR(255);

-- Add max_score column (what the work was marked out of)
ALTER TABLE student_marks
ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100;

COMMENT ON COLUMN student_marks.date_written IS 'Date when the coursework/test/assignment was written';
COMMENT ON COLUMN student_marks.topic IS 'Topic or title of the coursework/test/assignment';
COMMENT ON COLUMN student_marks.max_score IS 'Maximum score the work was marked out of';

-- Add index for date_written
CREATE INDEX IF NOT EXISTS idx_student_marks_date_written ON student_marks(date_written);
