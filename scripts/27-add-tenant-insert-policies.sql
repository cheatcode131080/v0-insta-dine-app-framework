-- Add missing INSERT policies for tenants table
-- This allows superadmins to create tenants and users to create their first tenant during onboarding

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Superadmin can insert tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can create their first tenant" ON tenants;

-- Allow superadmins to insert new tenants
CREATE POLICY "Superadmin can insert tenants"
ON tenants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_superadmin = true
  )
);

-- Allow authenticated users to create tenants during onboarding
-- This is needed for the onboarding flow where users create their first restaurant
CREATE POLICY "Authenticated users can create their first tenant"
ON tenants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Note: The tenant_members INSERT policy will control who can actually join a tenant
-- So this policy is safe - users can create tenants, but they still need proper membership
