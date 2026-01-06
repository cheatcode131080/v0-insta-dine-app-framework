# 3ELIXIR Test Accounts Setup

Follow these steps to create test accounts for the 3ELIXIR company:

## Step 1: Create the Tenant
Run the SQL script in this order:
```sql
scripts/17-create-3elixir-tenant.sql
```

This creates a tenant with:
- **Company Name**: 3ELIXIR Restaurant
- **Company Code**: 3ELIXIR (use this during signup/login)
- **Slug**: 3elixir

## Step 2: Sign Up Both Accounts

### Admin Account
1. Go to `/auth/signup`
2. Fill in the form:
   - **Full Name**: Admin User
   - **Email**: assassined13@gmail.com
   - **Password**: 123456
   - **Company Code**: 3ELIXIR
3. Click "Create account"
4. Verify your email if required

### Staff Account
1. Go to `/auth/signup`
2. Fill in the form:
   - **Full Name**: Staff User
   - **Email**: theedwinjoseph@gmail.com
   - **Password**: 123456
   - **Company Code**: 3ELIXIR
3. Click "Create account"
4. Verify your email if required

## Step 3: Assign Roles
After both accounts are created, run:
```sql
scripts/18-assign-3elixir-roles.sql
```

This will:
- Set `assassined13@gmail.com` as **Admin** (full access)
- Set `theedwinjoseph@gmail.com` as **Staff** (limited access)

## Step 4: Test Login

### Login as Admin
- **Company Code**: 3ELIXIR
- **Email**: assassined13@gmail.com
- **Password**: 123456
- Should have access to all features: Menu Master, Tables, Orders, Staff Management, Settings

### Login as Staff
- **Company Code**: 3ELIXIR
- **Email**: theedwinjoseph@gmail.com
- **Password**: 123456
- Should have limited access: Can view menus, process orders in Kitchen/Server views, but cannot edit settings or manage staff

## Features to Test

### As Admin (assassined13@gmail.com)
- ✓ Create/edit menu categories, subcategories, and items
- ✓ Upload item images
- ✓ Preview menu
- ✓ Create tables and generate QR codes
- ✓ View and manage all orders
- ✓ Invite and manage staff
- ✓ Edit restaurant settings
- ✓ View activity feed

### As Staff (theedwinjoseph@gmail.com)
- ✓ View menu (read-only)
- ✓ Access Kitchen view to mark items as preparing/ready
- ✓ Access Server view to update order status
- ✓ View dashboard stats
- ✗ Cannot edit menu items
- ✗ Cannot manage tables
- ✗ Cannot invite staff
- ✗ Cannot edit settings

## Troubleshooting

**If script 18 fails:**
- Make sure you've run script 17 first
- Verify both users have completed signup
- Check that email addresses match exactly

**If login fails:**
- Verify you're entering the company code: **3ELIXIR** (case-insensitive)
- Check email and password are correct
- Ensure you've completed email verification if enabled

**If permissions seem wrong:**
- Run script 18 again to reassign roles
- Log out and log back in to refresh permissions
