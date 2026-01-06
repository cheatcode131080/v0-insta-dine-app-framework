-- Phase 6: Order Workflow Schema
-- Create orders and order_items tables with strict status constraints

-- Drop existing orders and order_items if they exist
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Orders table with strict status constraints
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'preparing', 'ready', 'sent_out', 'closed', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'qr' CHECK (source IN ('qr', 'pos', 'admin')),
  customer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order items with snapshots for menu data
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  title_snapshot TEXT NOT NULL,
  description_snapshot TEXT,
  image_url_snapshot TEXT,
  qty INTEGER NOT NULL CHECK (qty > 0 AND qty <= 99),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_tenant_table ON orders(tenant_id, table_id, created_at DESC);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status, created_at DESC);
CREATE INDEX idx_order_items_tenant_order ON order_items(tenant_id, order_id);

-- Updated at trigger for orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at_trigger
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

-- Comment for reference
COMMENT ON TABLE orders IS 'Phase 6: Order workflow table with strict status constraints';
COMMENT ON TABLE order_items IS 'Phase 6: Order items with menu snapshots';
