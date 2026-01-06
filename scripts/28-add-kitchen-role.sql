-- Add kitchen role to tenant_members table constraint
-- This ensures the kitchen role is properly supported in the database

DO $$ 
BEGIN
  -- Drop existing constraint
  ALTER TABLE tenant_members DROP CONSTRAINT IF EXISTS tenant_members_role_check;
  
  -- Add new constraint with kitchen role
  ALTER TABLE tenant_members ADD CONSTRAINT tenant_members_role_check 
    CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'waiter', 'kitchen'));
    
  RAISE NOTICE 'Successfully added kitchen role to tenant_members constraint';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding kitchen role: %', SQLERRM;
END $$;
