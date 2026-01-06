-- Assign roles to 3ELIXIR test accounts
-- Run this script AFTER both users have signed up through the UI

-- Find the tenant
DO $$
DECLARE
  v_tenant_id uuid;
  v_admin_user_id uuid;
  v_staff_user_id uuid;
BEGIN
  -- Get tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = '3elixir';
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant 3elixir not found. Run script 17 first.';
  END IF;

  -- Get user IDs
  SELECT id INTO v_admin_user_id FROM users WHERE email = 'assassined13@gmail.com';
  SELECT id INTO v_staff_user_id FROM users WHERE email = 'theedwinjoseph@gmail.com';
  
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found. Please sign up assassined13@gmail.com first.';
  END IF;
  
  IF v_staff_user_id IS NULL THEN
    RAISE EXCEPTION 'Staff user not found. Please sign up theedwinjoseph@gmail.com first.';
  END IF;

  -- Update admin user membership to admin role
  UPDATE tenant_members 
  SET role = 'admin', updated_at = now()
  WHERE user_id = v_admin_user_id AND tenant_id = v_tenant_id;
  
  -- Update staff user membership to staff role (should already be staff by default)
  UPDATE tenant_members 
  SET role = 'staff', updated_at = now()
  WHERE user_id = v_staff_user_id AND tenant_id = v_tenant_id;
  
  -- Log the role assignments
  INSERT INTO activity_log (tenant_id, user_id, action, details, created_at)
  VALUES 
    (v_tenant_id, v_admin_user_id, 'user_role_updated', jsonb_build_object('role', 'admin', 'email', 'assassined13@gmail.com'), now()),
    (v_tenant_id, v_staff_user_id, 'user_role_updated', jsonb_build_object('role', 'staff', 'email', 'theedwinjoseph@gmail.com'), now());
  
  RAISE NOTICE 'Successfully assigned roles:';
  RAISE NOTICE '  - assassined13@gmail.com: admin';
  RAISE NOTICE '  - theedwinjoseph@gmail.com: staff';
END $$;
