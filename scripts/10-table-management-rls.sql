-- Phase 4: Table Management RLS Policies
-- Secure restaurant_tables and table_layouts with Row Level Security

-- Enable RLS
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_layouts ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's role in a tenant
CREATE OR REPLACE FUNCTION get_user_tenant_role(p_tenant_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM tenant_members
  WHERE tenant_id = p_tenant_id
  AND user_id = auth.uid()
  AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- restaurant_tables policies
-- Admin: Full CRUD
CREATE POLICY "Admins can manage tables"
  ON restaurant_tables
  FOR ALL
  USING (
    get_user_tenant_role(tenant_id) IN ('owner', 'admin', 'manager')
  )
  WITH CHECK (
    get_user_tenant_role(tenant_id) IN ('owner', 'admin', 'manager')
  );

-- Staff/Waiter: Read-only
CREATE POLICY "Staff can view tables"
  ON restaurant_tables
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = restaurant_tables.tenant_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

-- table_layouts policies
-- Admin: Full CRUD
CREATE POLICY "Admins can manage layouts"
  ON table_layouts
  FOR ALL
  USING (
    get_user_tenant_role(tenant_id) IN ('owner', 'admin', 'manager')
  )
  WITH CHECK (
    get_user_tenant_role(tenant_id) IN ('owner', 'admin', 'manager')
  );

-- Staff/Waiter: Read-only
CREATE POLICY "Staff can view layouts"
  ON table_layouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = table_layouts.tenant_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );
