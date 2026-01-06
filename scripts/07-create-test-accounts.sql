-- Create test accounts for admin and regular user
-- Note: You'll need to create these users in Supabase Auth first, or use the signup page

-- Test credentials:
-- Admin: admin@instadine.com / password: Admin123!
-- User: user@instadine.com / password: User123!

-- After creating auth users via signup, run this to set up their profiles and roles

-- Demo tenant (if not exists)
INSERT INTO tenants (id, name, slug, subscription_tier, subscription_status)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Restaurant', 'demo-restaurant', 'premium', 'active')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  subscription_tier = EXCLUDED.subscription_tier;

-- Function to create test user profiles and assign roles
-- This assumes the auth.users already exist (created via signup page)

-- Create or update user profiles (these will be created after signup via the auth trigger)
-- But we'll add the SQL here for reference

-- Create tenant memberships for existing auth users
-- Replace the UUIDs below with actual user IDs from auth.users after signup

DO $$
DECLARE
  admin_user_id UUID;
  regular_user_id UUID;
BEGIN
  -- Try to find users by email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@instadine.com' LIMIT 1;
  SELECT id INTO regular_user_id FROM auth.users WHERE email = 'user@instadine.com' LIMIT 1;

  -- If admin user exists, create profile and assign admin role
  IF admin_user_id IS NOT NULL THEN
    -- Insert into users table
    INSERT INTO users (id, email, full_name)
    VALUES (admin_user_id, 'admin@instadine.com', 'Admin User')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Assign admin role to demo tenant
    INSERT INTO tenant_members (tenant_id, user_id, role, is_active)
    VALUES ('00000000-0000-0000-0000-000000000001', admin_user_id, 'admin', true)
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'admin', is_active = true;

    RAISE NOTICE 'Admin user setup complete';
  ELSE
    RAISE NOTICE 'Admin user not found. Please sign up with admin@instadine.com first';
  END IF;

  -- If regular user exists, create profile and assign staff role
  IF regular_user_id IS NOT NULL THEN
    -- Insert into users table
    INSERT INTO users (id, email, full_name)
    VALUES (regular_user_id, 'user@instadine.com', 'Regular User')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Assign staff role to demo tenant
    INSERT INTO tenant_members (tenant_id, user_id, role, is_active)
    VALUES ('00000000-0000-0000-0000-000000000001', regular_user_id, 'staff', true)
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'staff', is_active = true;

    RAISE NOTICE 'Regular user setup complete';
  ELSE
    RAISE NOTICE 'Regular user not found. Please sign up with user@instadine.com first';
  END IF;
END $$;
