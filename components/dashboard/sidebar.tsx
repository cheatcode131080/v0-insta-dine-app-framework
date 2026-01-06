"use client"

import { Home, Menu, Users, UtensilsCrossed, TableIcon, ShoppingCart, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useTenant } from "@/lib/hooks/use-tenant"
import { createBrowserClient } from "@/lib/supabase/client"

const routes = [
  { href: "/dashboard", label: "Overview", icon: Home, permission: "canViewDashboard" as const },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart, permission: "canViewOrders" as const },
  { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed, permission: "canViewMenu" as const },
  { href: "/dashboard/tables", label: "Tables", icon: TableIcon, permission: "canViewTables" as const },
  { href: "/dashboard/staff", label: "Staff", icon: Users, permission: "canViewStaff" as const },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, permission: "canViewSettings" as const },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { tenant, permissions } = useTenant()
  const supabase = createBrowserClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const visibleRoutes = routes.filter((route) => {
    if (!permissions) return false
    return permissions[route.permission]
  })

  return (
    <div className="flex h-screen w-64 flex-col border-r border-purple-100 bg-gradient-to-b from-purple-50 to-white">
      <div className="flex h-16 items-center border-b border-purple-100 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold transition-all hover:scale-105">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-300">
            <Menu className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-lg font-bold text-transparent">
            InstaDine
          </span>
        </Link>
      </div>

      {tenant && (
        <div className="px-6 py-4">
          <div className="rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 p-4 shadow-sm border border-purple-200">
            <div className="text-sm font-semibold text-purple-900">{tenant.name}</div>
            <div className="mt-1 inline-flex items-center rounded-full bg-purple-200 px-2 py-0.5 text-xs font-medium capitalize text-purple-700">
              {tenant.subscription_tier}
            </div>
          </div>
        </div>
      )}

      <Separator className="bg-purple-100" />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {visibleRoutes.map((route) => {
            const isActive = pathname === route.href
            return (
              <Link key={route.href} href={route.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 transition-all",
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-200 hover:from-purple-700 hover:to-purple-600 hover:text-white"
                      : "text-gray-700 hover:bg-purple-100 hover:text-purple-700",
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-purple-100" />

      <div className="p-3">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-500 transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
