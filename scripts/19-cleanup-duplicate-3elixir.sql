-- Clean up duplicate 3ELIXIR tenant
-- Keep the uppercase version (3ELIXIR) and remove the lowercase one (3elixir)

DO $$
DECLARE
  lowercase_tenant_id UUID;
BEGIN
  -- Find the lowercase tenant ID
  SELECT id INTO lowercase_tenant_id
  FROM tenants
  WHERE slug = '3elixir';

  -- Delete any tenant_members associated with this tenant
  DELETE FROM tenant_members WHERE tenant_id = lowercase_tenant_id;

  -- Delete any activity logs associated with this tenant
  DELETE FROM activity_log WHERE tenant_id = lowercase_tenant_id;

  -- Delete the duplicate tenant
  DELETE FROM tenants WHERE id = lowercase_tenant_id;

  RAISE NOTICE 'Cleaned up duplicate lowercase tenant (3elixir)';
END $$;

-- Verify only the uppercase tenant remains
SELECT id, name, slug FROM tenants WHERE name LIKE '%3ELIXIR%';
