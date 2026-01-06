import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InviteStaffDialog } from "@/components/staff/invite-dialog"
import { CreateStaffDialog } from "@/components/staff/create-staff-dialog"
import { StaffMemberCard } from "@/components/staff/staff-member-card"
import { getRolePermissions } from "@/lib/permissions/roles"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function StaffPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Loading...</div>
  }

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  const tenantId = membership?.tenant_id

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">
            You don't have access to any restaurant yet. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  const permissions = getRolePermissions(membership.role)

  if (!permissions.canViewStaff) {
    redirect("/dashboard")
  }

  const canManage = permissions.canManageStaff

  // Fetch staff members
  const { data: staff } = await supabase
    .from("tenant_members")
    .select("*, users(*)")
    .eq("tenant_id", tenantId)
    .order("created_at")

  // Fetch pending invitations
  const { data: invitations } = await supabase
    .from("staff_invitations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">
            {canManage ? "Manage your restaurant staff and permissions" : "View restaurant staff"}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <CreateStaffDialog />
            <InviteStaffDialog />
          </div>
        )}
      </div>

      {invitations && invitations.length > 0 && canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{inv.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">Role: {inv.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Expires: {new Date(inv.expires_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {!staff || staff.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No staff members yet. {canManage && "Invite your first team member to get started."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {staff.map((member: any) => (
                <StaffMemberCard
                  key={member.id}
                  member={{ ...member, current_user_id: user.id }}
                  currentUserRole={membership?.role || "staff"}
                  onUpdate={() => {}}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
