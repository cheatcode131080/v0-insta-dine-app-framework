-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant IDs
CREATE OR REPLACE FUNCTION get_user_tenant_ids(user_uuid UUID)
RETURNS SETOF UUID AS $$
  SELECT tenant_id FROM tenant_members WHERE user_id = user_uuid AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user has role in tenant
CREATE OR REPLACE FUNCTION user_has_role(user_uuid UUID, tenant_uuid UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members 
    WHERE user_id = user_uuid 
    AND tenant_id = tenant_uuid 
    AND is_active = true
    AND (
      role = required_role 
      OR role IN ('owner', 'admin') -- owners and admins have all permissions
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies for tenants
CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  USING (id IN (SELECT get_user_tenant_ids(auth.uid())));

CREATE POLICY "Owners can update their tenants"
  ON tenants FOR UPDATE
  USING (user_has_role(auth.uid(), id, 'owner'));

-- RLS Policies for users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- RLS Policies for tenant_members
CREATE POLICY "Users can view members of their tenants"
  ON tenant_members FOR SELECT
  USING (tenant_id IN (SELECT get_user_tenant_ids(auth.uid())));

CREATE POLICY "Admins can manage members"
  ON tenant_members FOR ALL
  USING (user_has_role(auth.uid(), tenant_id, 'admin'));

-- RLS Policies for menu_categories
CREATE POLICY "Users can view categories of their tenants"
  ON menu_categories FOR SELECT
  USING (tenant_id IN (SELECT get_user_tenant_ids(auth.uid())));

CREATE POLICY "Staff can manage categories"
  ON menu_categories FOR ALL
  USING (user_has_role(auth.uid(), tenant_id, 'manager'));

-- RLS Policies for menu_items
CREATE POLICY "Users can view menu items of their tenants"
  ON menu_items FOR SELECT
  USING (tenant_id IN (SELECT get_user_tenant_ids(auth.uid())));

CREATE POLICY "Staff can manage menu items"
  ON menu_items FOR ALL
  USING (user_has_role(auth.uid(), tenant_id, 'manager'));

-- RLS Policies for tables
CREATE POLICY "Users can view tables of their tenants"
  ON tables FOR SELECT
  USING (tenant_id IN (SELECT get_user_tenant_ids(auth.uid())));

CREATE POLICY "Staff can manage tables"
  ON tables FOR ALL
  USING (user_has_role(auth.uid(), tenant_id, 'staff'));

-- RLS Policies for orders
CREATE POLICY "Users can view orders of their tenants"
  ON orders FOR SELECT
  USING (tenant_id IN (SELECT get_user_tenant_ids(auth.uid())));

CREATE POLICY "Staff can manage orders"
  ON orders FOR ALL
  USING (user_has_role(auth.uid(), tenant_id, 'staff'));

-- RLS Policies for order_items
CREATE POLICY "Users can view order items through orders"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    )
  );

CREATE POLICY "Staff can manage order items"
  ON order_items FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
      AND user_has_role(auth.uid(), tenant_id, 'staff')
    )
  );
