# Super Admin Setup Guide

## Overview

The InstaDine Super Admin Panel allows platform owners to manage all tenants, users, and view audit logs.

## Setup Instructions

### 1. Create Your Super Admin Account

First, sign up through the normal signup flow:

1. Go to `/auth/signup`
2. Sign up with your email (e.g., `admin@instadine.com`)
3. You can leave the company code blank or use any valid code

### 2. Grant Super Admin Privileges

Run the SQL script to grant superadmin privileges:

```sql
-- scripts/23-create-superadmin-account.sql
```

**Important:** Edit the script first and change the email to match yours:

```sql
DECLARE
  superadmin_email TEXT := 'YOUR_EMAIL@example.com';
```

Then run the script in your Supabase SQL editor.

### 3. Login as Super Admin

1. Go to `/auth/login`
2. Enter your email and password
3. **Leave company code blank** (superadmins don't need a company code)
4. You'll be automatically redirected to `/superadmin`

## Super Admin Features

### Dashboard (`/superadmin`)

- View platform statistics
- Total tenants, active tenants, total users
- Quick links to main features

### Tenants Management (`/superadmin/tenants`)

**Tenant Directory:**
- View all restaurant tenants
- Search by name or company code
- Filter by status (active/suspended)
- Sort by creation date

**Actions:**
- **Create Tenant** - Add new restaurants to the platform
- **View Details** - See full tenant information
- **Enter Panel** - Access tenant admin panel in support mode
- **Suspend/Activate** - Control tenant access

### Tenant Details (`/superadmin/tenants/[id]`)

- View tenant information
- Edit support notes (internal use)
- Suspend or activate tenant
- Enter tenant panel for troubleshooting
- View tenant users

### User Management (`/superadmin/tenants/[id]/users`)

- View all users in a tenant
- See user roles and status
- **Disable/Enable** users
- **Reset Password** (triggers Supabase password reset)
- View last login times

### Audit Logs (`/superadmin/audit`)

- Complete audit trail of all superadmin actions
- Filter by action type
- Filter by tenant
- View detailed metadata for each action

**Tracked Actions:**
- `TENANT_CREATE` - New tenant created
- `TENANT_SUSPEND` - Tenant suspended
- `TENANT_ACTIVATE` - Tenant activated
- `TENANT_ENTER` - Superadmin entered tenant panel
- `USER_DISABLE` - User account disabled
- `USER_ENABLE` - User account enabled
- `USER_PASSWORD_RESET_REQUEST` - Password reset initiated

## Support Mode

When you "Enter Tenant Panel", you'll see a yellow banner at the top:

**"Support Mode Active - You are viewing this tenant as a superadmin"**

Features:
- Full access to tenant admin panel
- Can troubleshoot issues
- All actions are logged
- Click "Exit Support Mode" to return to superadmin panel

## Security Features

### RLS Policies

- Superadmin status is protected - only superadmins can set `is_superadmin`
- Non-superadmins cannot access superadmin routes
- Disabled users are blocked at login
- All privileged operations are server-side

### Audit Logging

Every superadmin action is logged with:
- Actor (who did it)
- Action type
- Tenant affected
- Metadata (details)
- Timestamp

### Tenant Isolation

- Suspended tenants are blocked for normal users
- Superadmins can still access suspended tenants
- Each tenant's data is completely isolated

## Testing the System

### Create Test Tenants

1. Go to `/superadmin/tenants`
2. Click "Create Tenant"
3. Enter tenant name and company code
4. Tenant is created with `active` status

### Test Support Mode

1. Click "Enter Panel" on any tenant
2. You'll be redirected to their dashboard
3. Yellow banner confirms support mode
4. Click "Exit Support Mode" to return

### Test User Management

1. Go to tenant users page
2. Toggle user disabled status
3. Check audit logs to see the action recorded

### Test Tenant Suspension

1. Go to tenant details
2. Click "Suspend Tenant"
3. Regular users of that tenant will be blocked
4. Superadmin can still access it

## Troubleshooting

### Can't Login as Superadmin

- Verify `is_superadmin = true` in database
- Check you signed up first before running script
- Ensure you're not entering a company code

### "Unauthorized" Message

- RLS policies not applied - run `scripts/22-superadmin-rls.sql`
- User is not marked as superadmin in database

### Can't Access Tenant Panel

- Check tenant exists
- Verify `active_tenant_id` in localStorage
- Check browser console for errors

## API Endpoints

All superadmin operations use server-side functions:

- `lib/superadmin/guards.ts` - Auth checks
- `lib/superadmin/tenants.ts` - Tenant CRUD
- `lib/superadmin/users.ts` - User management
- `lib/audit/log.ts` - Audit logging

## Next Steps

- Add Supabase Admin API integration for password resets
- Add email notifications for tenant suspension
- Add analytics and reporting features
- Add bulk operations for users
- Add tenant backup/export functionality
</parameter>
