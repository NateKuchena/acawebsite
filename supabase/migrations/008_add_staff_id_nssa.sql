-- Add additional fields to staff table
-- ID Number: National ID / Passport number
-- NSSA Number: National Social Security Authority number
-- Phone: Staff contact number
-- Address: Staff residential address
-- Next of Kin Address: Emergency contact address

ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_number VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS nssa_number VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS next_of_kin_address TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_id_number ON staff(id_number);
CREATE INDEX IF NOT EXISTS idx_staff_nssa_number ON staff(nssa_number);
