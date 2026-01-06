-- Super Admin RLS Policies

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Superadmin can read all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Superadmin can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Superadmin can read all tenants" ON tenants;
DROP POLICY IF EXISTS "Superadmin can update all tenants" ON tenants;
DROP POLICY IF EXISTS "Superadmin can read all users" ON users;
DROP POLICY IF EXISTS "Superadmin can update users" ON users;
DROP POLICY IF EXISTS "Prevent non-superadmin from elevating privileges" ON users;

-- Audit Logs Policies
CREATE POLICY "Superadmin can read all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_superadmin = true
    )
  );

CREATE POLICY "Superadmin can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_superadmin = true
    )
  );

-- Tenants Policies for Superadmin
CREATE POLICY "Superadmin can read all tenants"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_superadmin = true
    )
  );

CREATE POLICY "Superadmin can update all tenants"
  ON tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_superadmin = true
    )
  );

-- Users Policies for Superadmin
CREATE POLICY "Superadmin can read all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_superadmin = true
    )
  );

CREATE POLICY "Superadmin can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_superadmin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_superadmin = true
    )
  );

-- Prevent privilege escalation: normal users cannot set is_superadmin
CREATE POLICY "Prevent non-superadmin from elevating privileges"
  ON users FOR UPDATE
  USING (
    -- Only allow update if user is NOT trying to change is_superadmin field
    -- OR if the updater is already a superadmin
    (auth.uid() = id AND is_superadmin = (SELECT is_superadmin FROM users WHERE id = auth.uid()))
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_superadmin = true
    )
  );

-- Note: Existing tenant member and admin policies should remain
-- Superadmin policies are additive and do not replace existing access controls
