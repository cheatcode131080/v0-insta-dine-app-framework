-- Complete rebuild of users table RLS policies to eliminate infinite recursion
-- The key: Keep SELECT policies simple - users can read their own profile, that's it!
-- Superadmin checks happen in application code AFTER reading the profile

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Superadmins can view all users" ON users;
DROP POLICY IF EXISTS "Superadmins can update users" ON users;
DROP POLICY IF EXISTS "Superadmin can read all users" ON users;
DROP POLICY IF EXISTS "Superadmin can update users" ON users;
DROP POLICY IF EXISTS "Prevent non-superadmin from elevating privileges" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS is_superadmin();

-- Create simple, non-recursive policies

-- 1. SELECT: Users can ALWAYS read their own profile (no recursion!)
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. INSERT: Allow service role to insert (for signup trigger)
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. UPDATE: Users can update their own non-sensitive fields
--    Prevent privilege escalation by blocking is_superadmin changes
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent changing superadmin status or disabled status
    is_superadmin = (SELECT is_superadmin FROM users WHERE id = auth.uid()) AND
    is_disabled = (SELECT is_disabled FROM users WHERE id = auth.uid())
  );

-- 4. Service role has full access (for admin operations via server)
CREATE POLICY "Service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment explaining the approach
COMMENT ON TABLE users IS 'RLS policies are intentionally simple to avoid recursion. Superadmin authorization checks happen at application level after profile is loaded.';
