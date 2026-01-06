import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Users, UtensilsCrossed, TrendingUp } from "lucide-react"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { redirect } from "next/navigation"
import { getRolePermissions } from "@/lib/permissions/roles"

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Loading...</div>
  }

  // Get user's first tenant for demo purposes
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("*, tenants(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  const tenantId = membership?.tenant_id

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome to InstaDine</h2>
          <p className="text-gray-500">
            You don't have access to any restaurant yet. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  const permissions = getRolePermissions(membership.role)

  // Kitchen staff should go directly to orders
  if (membership.role === "kitchen") {
    redirect("/dashboard/orders")
  }

  // Staff and waiters should go to orders if they can't view dashboard
  if (!permissions.canViewDashboard && permissions.canViewOrders) {
    redirect("/dashboard/orders")
  }

  // If user cannot view dashboard, redirect to first available route
  if (!permissions.canViewDashboard) {
    if (permissions.canViewMenu) redirect("/dashboard/menu")
    if (permissions.canViewOrders) redirect("/dashboard/orders")
    redirect("/auth/login") // No permissions
  }

  // Fetch stats
  const { count: ordersCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)

  const { count: menuItemsCount } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)

  const { count: tablesCount } = await supabase
    .from("restaurant_tables")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)

  const { count: staffCount } = await supabase
    .from("tenant_members")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true)

  const stats = [
    {
      title: "Total Orders",
      value: ordersCount || 0,
      icon: ShoppingCart,
      description: "Active orders",
      trend: "+12%",
      trendUp: true,
      color: "purple",
      bgGradient: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Menu Items",
      value: menuItemsCount || 0,
      icon: UtensilsCrossed,
      description: "Available dishes",
      trend: "+3",
      trendUp: true,
      color: "emerald",
      bgGradient: "from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Tables",
      value: tablesCount || 0,
      icon: DollarSign,
      description: "Restaurant tables",
      color: "blue",
      bgGradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Staff Members",
      value: staffCount || 0,
      icon: Users,
      description: "Active staff",
      color: "orange",
      bgGradient: "from-orange-500 to-orange-600",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            Welcome back
            <span className="inline-block ml-2">👋</span>
          </h2>
          <p className="mt-2 text-lg text-gray-500">Here's what's happening with your restaurant today.</p>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5">
          <span>+ New Restaurant</span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="group relative overflow-hidden border-0 bg-white shadow-lg shadow-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
              <div className={`rounded-xl ${stat.iconBg} p-3 transition-transform group-hover:scale-110`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">{stat.value}</span>
                <span className="text-2xl font-light text-gray-300">.00</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {stat.trend && (
                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      stat.trendUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {stat.trend}
                  </span>
                )}
                <span className="text-sm text-gray-500">{stat.description}</span>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.bgGradient}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed tenantId={tenantId} />
        </div>
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 text-white shadow-xl shadow-purple-200">
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold">How to manage your restaurant?</h3>
            <p className="mt-2 text-purple-100">
              Learn best practices for managing orders, staff, and menu items effectively.
            </p>
            <button className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-purple-600 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
              Learn More
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
