import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProfileEditor } from "@/components/settings/profile-editor"
import { RestaurantEditor } from "@/components/settings/restaurant-editor"
import { getRolePermissions } from "@/lib/permissions/roles"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Loading...</div>
  }

  // Get user profile
  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("*, tenants(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  const tenant = membership?.tenants

  if (membership?.role) {
    const permissions = getRolePermissions(membership.role)
    if (!permissions.canViewSettings) {
      redirect("/dashboard")
    }
  }

  const canEditRestaurant = membership?.role && ["owner", "admin"].includes(membership.role)

  if (!tenant) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your profile settings</p>
        </div>

        <ProfileEditor user={userProfile} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your restaurant settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProfileEditor user={userProfile} />

        <RestaurantEditor tenant={tenant} canEdit={canEditRestaurant} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Plan</p>
            <Badge variant="default" className="mt-1 capitalize">
              {tenant?.subscription_tier}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge
              variant={tenant?.subscription_status === "active" ? "default" : "secondary"}
              className="mt-1 capitalize"
            >
              {tenant?.subscription_status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Role & Permissions</CardTitle>
          <CardDescription>Your access level in this restaurant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <Badge variant="default" className="mt-1 capitalize">
              {membership?.role}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Access Permissions</p>
            <div className="space-y-1 text-sm">
              {membership?.role === "owner" || membership?.role === "admin" ? (
                <p className="text-muted-foreground">✓ Full access to all features</p>
              ) : membership?.role === "manager" ? (
                <>
                  <p className="text-muted-foreground">✓ View and manage menu, orders, tables, and staff</p>
                  <p className="text-muted-foreground">✗ Cannot modify settings</p>
                </>
              ) : membership?.role === "staff" || membership?.role === "waiter" ? (
                <>
                  <p className="text-muted-foreground">✓ View menu and manage orders</p>
                  <p className="text-muted-foreground">✗ Cannot modify menu, tables, staff, or settings</p>
                </>
              ) : membership?.role === "kitchen" ? (
                <>
                  <p className="text-muted-foreground">✓ View and update order status</p>
                  <p className="text-muted-foreground">✗ Cannot access other features</p>
                </>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
