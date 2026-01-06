# InstaDine Multi-Tenant System

## Overview

InstaDine is a fully multi-tenant platform where each restaurant operates as a separate tenant with isolated data. Users can belong to multiple tenants with different roles.

## How It Works

### 1. User Onboarding Flow

**New User Signup:**
1. User creates account at `/auth/signup`
2. Supabase Auth creates auth user
3. Database trigger automatically creates user profile in `users` table
4. User is redirected to `/onboarding`

**Onboarding Process:**
1. User lands on `/onboarding` page
2. Prompted to create their first restaurant
3. Enters restaurant name and URL slug
4. System creates:
   - New tenant record in `tenants` table
   - Tenant membership in `tenant_members` table with `admin` role
   - Activity log entry
5. User is redirected to `/dashboard`

### 2. Tenant Management

**Creating Additional Tenants:**
- Admins can create new restaurants via "New Restaurant" button in header
- Accessible from `TenantSwitcher` component
- Creates new tenant and assigns creator as admin

**Switching Between Tenants:**
- When user has multiple tenants, dropdown appears in header
- Switching reloads app with new tenant context
- Active tenant stored in localStorage

**Tenant Context:**
- All pages wrapped in `TenantProvider`
- Current tenant accessible via `useTenant()` hook
- Automatically filters all data by tenant_id

### 3. Data Isolation

**Row Level Security (RLS):**
- Every table with tenant_id has RLS policies
- Users can only access data for tenants they're members of
- Policies check `tenant_members` table for authorization

**Tables with Multi-Tenancy:**
- `tenants` - Restaurant information
- `tenant_members` - User-tenant relationships with roles
- `menu_categories`, `menu_subcategories`, `menu_items` - Menu data
- `restaurant_tables`, `table_layouts` - Table management
- `orders`, `order_items` - Order tracking
- `activity_log` - Audit trail
- `staff_invitations` - Pending invites

### 4. Roles & Permissions

**Available Roles:**
- `owner` - Full access, can delete tenant
- `admin` - Can manage all settings, staff, and content
- `manager` - Can manage menu and tables, view orders
- `staff` - Can view orders, update order status
- `kitchen` - Kitchen-only view
- `server` - Server-only view

**Permission Checks:**
- Performed in server actions and RLS policies
- Frontend checks via `membership.role`
- Backend enforced via database policies

### 5. Key Components

**TenantProvider** (`lib/hooks/use-tenant.tsx`)
- Loads user's tenants on mount
- Manages active tenant state
- Provides `switchTenant` function

**TenantSwitcher** (`components/dashboard/tenant-switcher.tsx`)
- Dropdown for switching tenants (when user has multiple)
- "New Restaurant" button for creating tenants
- Hidden when user has only one tenant

**CreateTenantDialog** (`components/tenants/create-tenant-dialog.tsx`)
- Form for creating new restaurants
- Auto-generates URL slug from name
- Validates slug uniqueness

### 6. Database Schema

```sql
-- Core tenant tables
tenants (id, name, slug, subscription_tier, subscription_status, created_at)
tenant_members (id, tenant_id, user_id, role, is_active, created_at)

-- All data tables include:
tenant_id UUID REFERENCES tenants(id)
```

### 7. Usage Examples

**In Server Components:**
```typescript
import { createServerClient } from "@/lib/supabase/server"

const supabase = await createServerClient()
const { data: { user } } = await supabase.auth.getUser()

// Get user's active tenant
const { data: membership } = await supabase
  .from("tenant_members")
  .select("*, tenants(*)")
  .eq("user_id", user.id)
  .eq("is_active", true)
  .single()

const tenantId = membership?.tenant_id
```

**In Client Components:**
```typescript
import { useTenant } from "@/lib/hooks/use-tenant"

function MyComponent() {
  const { tenant, tenants, membership, switchTenant } = useTenant()
  
  // Current active tenant
  console.log(tenant.name)
  
  // Check permissions
  const isAdmin = membership?.role === 'admin'
  
  // Switch tenant
  if (tenants.length > 1) {
    switchTenant(tenants[1].id)
  }
}
```

### 8. Testing the Multi-Tenant System

**Create Multiple Tenants:**
1. Sign up with first email (e.g., `admin1@test.com`)
2. Create first restaurant (e.g., "Bella Italia")
3. Log out
4. Sign up with second email (e.g., `admin2@test.com`)
5. Create second restaurant (e.g., "Sushi Palace")
6. Log back in as first user
7. Click "New Restaurant" to create third restaurant
8. Use tenant switcher to switch between restaurants

**Verify Data Isolation:**
1. Create menu items in Restaurant A
2. Switch to Restaurant B
3. Verify Restaurant A's menu items are NOT visible
4. Each tenant has completely separate data

**Test Invitations:**
1. Admin of Restaurant A invites user@example.com
2. User accepts and joins Restaurant A
3. User can now see Restaurant A's data
4. User creates their own Restaurant C
5. User now has access to both restaurants
6. Switcher shows both options

## Future Enhancements

- [ ] Tenant transfer (change ownership)
- [ ] Tenant deletion with data cleanup
- [ ] Invite links with expiration
- [ ] Cross-tenant reporting for franchises
- [ ] Tenant branding customization
- [ ] Per-tenant feature flags
