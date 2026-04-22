-- =============================================
-- ADD SEX AND HOUSE FIELDS TO STUDENTS
-- =============================================

-- Add sex column (Male/Female)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS sex VARCHAR(10);

-- Add house column (Norman/Austin)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS house VARCHAR(20);

-- Add comments
COMMENT ON COLUMN students.sex IS 'Student sex: Male or Female';
COMMENT ON COLUMN students.house IS 'Student house: Norman or Austin';

-- Add index for house (useful for filtering/grouping by house)
CREATE INDEX IF NOT EXISTS idx_students_house ON students(house);
