-- Enable RLS and create policies for menu_subcategories
-- Enable Row Level Security
ALTER TABLE menu_subcategories ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's role in tenant
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID, tenant_uuid UUID)
RETURNS TEXT AS $$
  SELECT role FROM tenant_members 
  WHERE user_id = user_uuid 
  AND tenant_id = tenant_uuid 
  AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies for menu_subcategories
-- All users can view subcategories of their tenants
CREATE POLICY "Users can view subcategories of their tenants"
  ON menu_subcategories FOR SELECT
  USING (tenant_id IN (SELECT get_user_tenant_ids(auth.uid())));

-- Only admin and manager roles can insert subcategories
CREATE POLICY "Admins and managers can insert subcategories"
  ON menu_subcategories FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    AND get_user_role(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
  );

-- Only admin and manager roles can update subcategories
CREATE POLICY "Admins and managers can update subcategories"
  ON menu_subcategories FOR UPDATE
  USING (
    tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    AND get_user_role(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
  )
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    AND get_user_role(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
  );

-- Only admin and manager roles can delete subcategories
CREATE POLICY "Admins and managers can delete subcategories"
  ON menu_subcategories FOR DELETE
  USING (
    tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    AND get_user_role(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
  );

-- Update existing policies for menu_categories and menu_items to be more restrictive
DROP POLICY IF EXISTS "Staff can manage categories" ON menu_categories;
DROP POLICY IF EXISTS "Staff can manage menu items" ON menu_items;

-- Categories policies
CREATE POLICY "Admins and managers can insert categories"
  ON menu_categories FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    AND get_user_role(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Admins and managers can update categories"
  ON menu_categories FOR UPDATE
  USING (
    tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    AND get_user_role(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Admins and managers can delete categories"
  ON menu_categories FOR DELETE
  USING (
    tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    AND get_user_role(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
  );

-- Menu items policies
CREATE POLICY "Admins and managers can insert menu items"
  ON menu_items FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    AND get_user_role(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Admins and managers can update menu items"
  ON menu_items FOR UPDATE
  USING (
    tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    AND get_user_role(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
  );

CREATE POLICY "Admins and managers can delete menu items"
  ON menu_items FOR DELETE
  USING (
    tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    AND get_user_role(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
  );
