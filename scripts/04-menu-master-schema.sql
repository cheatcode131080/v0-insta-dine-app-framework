-- Add menu_subcategories table and update menu_items for Phase 2
-- Menu Subcategories
CREATE TABLE IF NOT EXISTS menu_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_subcategory_per_category UNIQUE (tenant_id, category_id, name)
);

-- Update menu_categories to use sort_order instead of display_order
ALTER TABLE menu_categories DROP COLUMN IF EXISTS display_order;
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Add unique constraint to menu_categories
ALTER TABLE menu_categories DROP CONSTRAINT IF EXISTS unique_category_per_tenant;
ALTER TABLE menu_categories ADD CONSTRAINT unique_category_per_tenant UNIQUE (tenant_id, name);

-- Update menu_items to add subcategory_id and sort_order
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES menu_subcategories(id) ON DELETE SET NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Change menu_items.title to match spec (currently using 'name')
ALTER TABLE menu_items RENAME COLUMN name TO title;

-- Update menu_items category_id constraint to RESTRICT instead of SET NULL
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_category_id_fkey;
ALTER TABLE menu_items ADD CONSTRAINT menu_items_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE RESTRICT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_subcategories_tenant_id ON menu_subcategories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_subcategories_category_id ON menu_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_subcategories_tenant_sort ON menu_subcategories(tenant_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_tenant_sort ON menu_categories(tenant_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_sort ON menu_items(tenant_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_subcategory ON menu_items(tenant_id, subcategory_id);

-- Updated at trigger for menu_subcategories
CREATE TRIGGER update_menu_subcategories_updated_at 
  BEFORE UPDATE ON menu_subcategories 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
