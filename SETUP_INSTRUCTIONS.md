# InstaDine Setup Instructions

## Prerequisites
- Supabase account and project
- All environment variables configured in v0

## Database Setup

Run the SQL scripts in order:

1. **Create Tables** - Run `scripts/01-create-tables.sql`
   - Creates all core tables (tenants, users, tenant_members, menu, orders, etc.)

2. **Enable RLS** - Run `scripts/02-enable-rls.sql`
   - Enables Row Level Security on all tables
   - Sets up helper functions and policies

3. **Seed Data** - Run `scripts/03-seed-data.sql`
   - Creates sample tenant and categories

4. **Menu Master Schema** - Run `scripts/04-menu-master-schema.sql`
   - Adds menu_subcategories table

5. **Menu Master RLS** - Run `scripts/05-menu-master-rls.sql`
   - Adds RLS policies for subcategories

6. **Storage Bucket** - Run `scripts/06-menu-storage-bucket.sql`
   - Creates storage bucket for menu images

7. **Test Accounts** - Run `scripts/07-create-test-accounts.sql`
   - Creates test tenant and assigns roles

8. **Fix User Creation** - Run `scripts/08-fix-user-creation-trigger.sql` ⭐
   - **IMPORTANT**: This fixes the signup flow by creating a trigger
   - Must be run BEFORE signing up

## Testing

After running all scripts, you can test with these accounts:

### Admin Account
- **Email**: admin@instadine.test
- **Password**: Admin123!
- **Role**: Owner (full access)

### Regular User Account
- **Email**: user@instadine.test
- **Password**: User123!
- **Role**: Staff (read-only access)

## Signup Flow

1. Navigate to `/auth/signup`
2. Enter your details
3. The database trigger automatically creates your user profile
4. Check email for confirmation link (if email confirmation is enabled)
5. After confirmation, run script 07 to assign roles

## Troubleshooting

### "Database error saving new user"
- **Solution**: Make sure you've run `scripts/08-fix-user-creation-trigger.sql`
- This script creates the automatic trigger that handles user profile creation

### "Row Level Security policy violation"
- **Solution**: Ensure scripts 01, 02, and 08 have been run in order
- Check that the trigger function exists in Supabase SQL Editor

### Email confirmation not working
- **Solution**: In Supabase Dashboard → Authentication → Settings
- Disable "Enable email confirmations" for testing
- Or configure SMTP settings for production

### Users can't see dashboard
- **Solution**: Run `scripts/07-create-test-accounts.sql` after creating users
- This assigns them to tenants with proper roles
