-- Insert demo tenant
INSERT INTO tenants (id, name, slug, subscription_tier)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Restaurant', 'demo-restaurant', 'premium')
ON CONFLICT (id) DO NOTHING;

-- Insert demo categories
INSERT INTO menu_categories (tenant_id, name, description, display_order)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Appetizers', 'Start your meal right', 1),
  ('00000000-0000-0000-0000-000000000001', 'Main Courses', 'Our signature dishes', 2),
  ('00000000-0000-0000-0000-000000000001', 'Desserts', 'Sweet endings', 3),
  ('00000000-0000-0000-0000-000000000001', 'Beverages', 'Drinks and refreshments', 4)
ON CONFLICT DO NOTHING;

-- Insert demo menu items
INSERT INTO menu_items (tenant_id, category_id, name, description, price, is_available)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  c.id,
  'Sample Item',
  'Delicious sample menu item',
  12.99,
  true
FROM menu_categories c
WHERE c.tenant_id = '00000000-0000-0000-0000-000000000001'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert demo tables
INSERT INTO tables (tenant_id, table_number, capacity, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'T1', 2, 'available'),
  ('00000000-0000-0000-0000-000000000001', 'T2', 4, 'available'),
  ('00000000-0000-0000-0000-000000000001', 'T3', 4, 'available'),
  ('00000000-0000-0000-0000-000000000001', 'T4', 6, 'available'),
  ('00000000-0000-0000-0000-000000000001', 'T5', 8, 'available')
ON CONFLICT DO NOTHING;
