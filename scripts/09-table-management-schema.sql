-- Phase 4: Table Management Schema
-- Creates restaurant_tables and table_layouts tables

-- Restaurant Tables (logical tables)
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_table_name_per_tenant UNIQUE (tenant_id, display_name)
);

-- Table Layouts (visual positioning)
CREATE TABLE IF NOT EXISTS table_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  radius FLOAT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_table_layout UNIQUE (table_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_tenant_id ON restaurant_tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_table_layouts_tenant_id ON table_layouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_table_layouts_table_id ON table_layouts(table_id);

-- Add comment for documentation
COMMENT ON TABLE restaurant_tables IS 'Logical restaurant tables for multi-tenant system';
COMMENT ON TABLE table_layouts IS 'Visual positioning data for table layout canvas';
