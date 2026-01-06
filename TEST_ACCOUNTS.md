# Test Accounts Setup Guide

## Steps to Create Test Accounts

### 1. Sign Up Users

First, you need to create the auth users using the signup page:

1. Go to `/auth/signup`
2. Create the **Admin Account**:
   - Email: `admin@instadine.com`
   - Password: `Admin123!`
   - Full Name: `Admin User`

3. Sign out, then create the **Regular User Account**:
   - Email: `user@instadine.com`
   - Password: `User123!`
   - Full Name: `Regular User`

### 2. Run the SQL Script

After signing up both users, run the SQL script to assign roles:

```bash
# Run script 07-create-test-accounts.sql
```

This script will:
- Create/verify the Demo Restaurant tenant
- Assign the admin user as an **admin** role
- Assign the regular user as a **staff** role

### 3. Test the Accounts

**Admin Account** (`admin@instadine.com`):
- Can create, edit, and delete menu items
- Can manage categories and subcategories
- Full access to all features

**Regular User Account** (`user@instadine.com`):
- Read-only access to menu items
- Cannot create, edit, or delete items
- Can view all restaurant data

### 4. Login

Go to `/auth/login` and use either:
- Admin: `admin@instadine.com` / `Admin123!`
- User: `user@instadine.com` / `User123!`

## Alternative: Manual Setup

If you prefer to use different emails or the script doesn't work:

1. Sign up with your desired email addresses
2. Note the user IDs from Supabase Auth dashboard
3. Manually run these SQL commands:

```sql
-- For admin user
INSERT INTO tenant_members (tenant_id, user_id, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'YOUR_ADMIN_USER_ID', 'admin', true);

-- For regular user
INSERT INTO tenant_members (tenant_id, user_id, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'YOUR_USER_ID', 'staff', true);
```

## Troubleshooting

If you can't see the tenant after logging in:
1. Check that the user exists in `auth.users`
2. Check that the user profile exists in the `users` table
3. Check that `tenant_members` has the correct mapping
4. Verify RLS policies are enabled

## Note on Email Verification

Supabase may require email verification for new accounts. If email confirmation is enabled:
- Check your email inbox for the confirmation link
- Or disable email confirmation in Supabase Dashboard → Authentication → Settings → "Enable email confirmations" (turn off for testing)
