import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, UtensilsCrossed, Users, Settings, UserPlus, UserMinus, FileText, QrCode } from "lucide-react"

const actionIcons: Record<string, any> = {
  order_created: ShoppingCart,
  order_updated: ShoppingCart,
  menu_item_created: UtensilsCrossed,
  menu_item_updated: UtensilsCrossed,
  menu_item_deleted: UtensilsCrossed,
  staff_invited: UserPlus,
  staff_updated: Users,
  staff_removed: UserMinus,
  tenant_updated: Settings,
  table_created: FileText,
  qr_generated: QrCode,
}

const actionLabels: Record<string, string> = {
  order_created: "created an order",
  order_updated: "updated an order",
  menu_item_created: "added a menu item",
  menu_item_updated: "updated a menu item",
  menu_item_deleted: "removed a menu item",
  staff_invited: "invited a staff member",
  staff_updated: "updated a staff member",
  staff_removed: "removed a staff member",
  tenant_updated: "updated restaurant settings",
  table_created: "created a table",
  qr_generated: "generated QR codes",
}

function getRelativeTime(date: string) {
  const now = new Date()
  const activityDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return activityDate.toLocaleDateString()
}

export async function ActivityFeed({ tenantId }: { tenantId: string | undefined }) {
  if (!tenantId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity available.</p>
        </CardContent>
      </Card>
    )
  }

  const supabase = await createServerSupabaseClient()

  // Fetch recent activity
  const { data: activities } = await supabase
    .from("activity_log")
    .select("*, users(full_name, email, avatar_url)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10)

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity to display.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity: any) => {
            const Icon = actionIcons[activity.action] || FileText
            const label = actionLabels[activity.action] || activity.action.replace(/_/g, " ")

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm">
                      <span className="font-medium">
                        {activity.users?.full_name || activity.users?.email || "Someone"}
                      </span>{" "}
                      {label}
                    </p>
                  </div>
                  {activity.details && Object.keys(activity.details).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activity.details.name && (
                        <Badge variant="outline" className="text-xs">
                          {activity.details.name}
                        </Badge>
                      )}
                      {activity.details.email && (
                        <Badge variant="outline" className="text-xs">
                          {activity.details.email}
                        </Badge>
                      )}
                      {activity.details.role && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {activity.details.role}
                        </Badge>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{getRelativeTime(activity.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
