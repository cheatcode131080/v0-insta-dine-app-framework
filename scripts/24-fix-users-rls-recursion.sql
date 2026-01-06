-- Fix infinite recursion in users table RLS policies
-- Remove problematic policies and recreate with proper logic

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Superadmins can view all users" ON users;

-- Recreate policies without recursion
-- Allow users to view their own profile (no recursive check)
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile (no recursive check on is_superadmin)
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow superadmins to view all users (simple check, no recursion)
CREATE POLICY "Superadmins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_superadmin = true
    )
  );

-- Allow superadmins to update any user
CREATE POLICY "Superadmins can update all users"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_superadmin = true
    )
  );

-- Allow system to insert new users (for signup/auth trigger)
CREATE POLICY "Allow insert for authenticated users"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
