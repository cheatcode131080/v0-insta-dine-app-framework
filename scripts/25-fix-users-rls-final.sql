-- Fix infinite recursion in users table RLS policies
-- The issue: checking is_superadmin in a policy that applies to the users table
-- creates recursion when querying the users table

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Superadmins can view all users" ON users;
DROP POLICY IF EXISTS "Superadmins can update all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Prevent privilege escalation on insert" ON users;
DROP POLICY IF EXISTS "Prevent privilege escalation on update" ON users;

-- Simple policy: users can view their own profile (no subquery)
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Simple policy: users can update their own basic profile fields
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND is_superadmin = (SELECT is_superadmin FROM users WHERE id = auth.uid())
  AND is_disabled = (SELECT is_disabled FROM users WHERE id = auth.uid())
);

-- Allow service role (backend) to manage all users
-- Service role bypasses RLS, but we add this for clarity
CREATE POLICY "Service role can manage users"
ON users FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Create a function to check superadmin status safely
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_superadmin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create superadmin policies using the function
CREATE POLICY "Superadmins can view all users"
ON users FOR SELECT
USING (is_superadmin());

CREATE POLICY "Superadmins can update users"
ON users FOR UPDATE
USING (is_superadmin())
WITH CHECK (
  -- Prevent superadmins from removing their own superadmin status
  CASE 
    WHEN id = auth.uid() THEN is_superadmin = true
    ELSE true
  END
);
