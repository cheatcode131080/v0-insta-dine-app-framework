-- Phase 6: RLS Policies for Order Workflow
-- Enable RLS on orders and order_items

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Orders Policies
-- Admin: Full access to orders in their tenant
CREATE POLICY "admin_orders_all" ON orders
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'admin'));

-- Staff: SELECT and UPDATE status for their tenant
CREATE POLICY "staff_orders_select" ON orders
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "staff_orders_update" ON orders
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Order Items Policies
-- Admin: Full access to order_items in their tenant
CREATE POLICY "admin_order_items_all" ON order_items
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'admin'));

-- Staff: SELECT for their tenant
CREATE POLICY "staff_order_items_select" ON order_items
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- Note: Public INSERT for orders/order_items will be handled via Edge Function using service role
-- This is safer than allowing direct public inserts with policies

COMMENT ON POLICY "admin_orders_all" ON orders IS 'Admin full access to orders';
COMMENT ON POLICY "staff_orders_select" ON orders IS 'Staff can view orders';
COMMENT ON POLICY "staff_orders_update" ON orders IS 'Staff can update order status';
