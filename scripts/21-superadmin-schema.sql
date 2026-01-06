-- Super Admin Schema: Add superadmin fields to profiles, update tenants, create audit_logs

-- 1. Update users table (rename from profiles in original spec, but we have "users")
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2. Update tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS support_notes TEXT;

-- Add CHECK constraint on status if not exists
DO $$ BEGIN
  ALTER TABLE tenants ADD CONSTRAINT tenants_status_check 
    CHECK (status IN ('active', 'suspended'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_profile_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'superadmin',
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Comment for clarity
COMMENT ON TABLE audit_logs IS 'Audit trail for superadmin actions and important system events';
COMMENT ON COLUMN users.is_superadmin IS 'Platform owner flag - can access super admin panel';
COMMENT ON COLUMN users.is_disabled IS 'Disabled users cannot log in';
COMMENT ON COLUMN tenants.status IS 'active | suspended - suspended tenants are blocked except for superadmin';
