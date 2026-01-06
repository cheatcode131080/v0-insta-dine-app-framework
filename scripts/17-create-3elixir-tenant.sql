-- Create the 3ELIXIR tenant for testing
-- Run this script first before signing up the test accounts

-- Updated slug to uppercase 3ELIXIR to match company code requirements
-- Create the tenant
INSERT INTO tenants (name, slug, created_at, updated_at)
VALUES (
  '3ELIXIR Restaurant',
  '3ELIXIR',
  now(),
  now()
)
ON CONFLICT (slug) DO NOTHING;

-- Added entity_type field to fix NOT NULL constraint
-- Log activity
INSERT INTO activity_log (tenant_id, user_id, action, entity_type, entity_id, details, created_at)
SELECT 
  t.id,
  NULL,
  'tenant_created',
  'tenant',
  t.id,
  jsonb_build_object('name', '3ELIXIR Restaurant', 'slug', '3ELIXIR'),
  now()
FROM tenants t
WHERE t.slug = '3ELIXIR'
ON CONFLICT DO NOTHING;
