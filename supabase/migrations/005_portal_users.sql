-- Create portal_users table to track registered parent users
-- This table syncs with auth.users for portal access management

CREATE TABLE IF NOT EXISTS portal_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email search
CREATE INDEX IF NOT EXISTS idx_portal_users_email ON portal_users(email);

-- Enable RLS
ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read portal_users
CREATE POLICY "Authenticated users can read portal_users"
  ON portal_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for users to update their own record
CREATE POLICY "Users can update own portal_users record"
  ON portal_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Function to automatically add user to portal_users on signup
CREATE OR REPLACE FUNCTION handle_new_portal_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.portal_users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_portal ON auth.users;

-- Create trigger to add users to portal_users
CREATE TRIGGER on_auth_user_created_portal
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_portal_user();

-- Ensure parent_student_links table exists with proper structure
CREATE TABLE IF NOT EXISTS parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, student_id)
);

-- Create indexes for parent_student_links
CREATE INDEX IF NOT EXISTS idx_parent_student_links_user ON parent_student_links(user_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON parent_student_links(student_id);

-- Enable RLS on parent_student_links
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all links (for admin)
CREATE POLICY "Authenticated users can read parent_student_links"
  ON parent_student_links
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert links (admin only in practice)
CREATE POLICY "Authenticated users can insert parent_student_links"
  ON parent_student_links
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for authenticated users to delete links (admin only in practice)
CREATE POLICY "Authenticated users can delete parent_student_links"
  ON parent_student_links
  FOR DELETE
  TO authenticated
  USING (true);

-- Sync existing auth users to portal_users (run once)
INSERT INTO portal_users (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;
