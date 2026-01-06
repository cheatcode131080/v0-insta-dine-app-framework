import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, FileText, Activity } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp } from "lucide-react"

export default async function SuperAdminDashboard() {
  const supabase = await createServerClient()

  // Fetch summary stats
  const [tenantsResult, usersResult, auditLogsResult] = await Promise.all([
    supabase.from("tenants").select("id, status", { count: "exact" }),
    supabase.from("users").select("id", { count: "exact" }),
    supabase.from("audit_logs").select("id", { count: "exact" }),
  ])

  const activeTenants = tenantsResult.data?.filter((t) => t.status === "active" || !t.status).length || 0
  const totalTenants = tenantsResult.count || 0
  const totalUsers = usersResult.count || 0
  const totalAuditLogs = auditLogsResult.count || 0

  const stats = [
    {
      title: "Total Tenants",
      value: totalTenants,
      subtitle: `${activeTenants} active`,
      icon: Building2,
      trend: "+3",
      trendUp: true,
    },
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      trend: "+24",
      trendUp: true,
    },
    {
      title: "Audit Logs",
      value: totalAuditLogs,
      icon: FileText,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 px-3 py-1 text-xs font-medium text-primary shadow-sm">
          <Activity className="h-3 w-3 animate-pulse" />
          Super Admin Portal
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Platform Dashboard</h1>
        <p className="mt-2 text-lg text-muted-foreground">Monitor and manage the entire InstaDine platform</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-2.5 transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {stat.trend && (
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${stat.trendUp ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                    >
                      <TrendingUp className="h-3 w-3" />
                      {stat.trend}
                    </span>
                  )}
                  {stat.subtitle && <span className="text-muted-foreground">{stat.subtitle}</span>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="group relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              Tenant Management
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-sm text-muted-foreground">
              Create new tenants, manage subscriptions, and monitor restaurant operations across the platform.
            </p>
            <Link href="/superadmin/tenants">
              <Button className="w-full gap-2 shadow-lg">
                Manage Tenants <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <p className="text-sm text-muted-foreground">
              Track all administrative actions and system changes for security and compliance.
            </p>
            <Link href="/superadmin/audit">
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                View Audit Logs <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
