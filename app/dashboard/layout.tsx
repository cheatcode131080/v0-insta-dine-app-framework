import type React from "react"
import { TenantProvider } from "@/lib/hooks/use-tenant"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TenantSwitcher } from "@/components/dashboard/tenant-switcher"
import { TenantBanner } from "@/components/dashboard/tenant-banner"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("users").select("is_superadmin, is_disabled").eq("id", user.id).single()

  // Superadmins can access any tenant, regular users need membership
  if (!profile?.is_superadmin) {
    const { data: membership } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()

    if (!membership) {
      redirect("/onboarding")
    }
  }

  return (
    <TenantProvider>
      <div className="flex h-screen flex-col">
        <TenantBanner />
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col">
            <header className="flex h-16 items-center justify-between border-b bg-background px-6">
              <h1 className="text-xl font-semibold">Dashboard</h1>
              <TenantSwitcher />
            </header>
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </div>
    </TenantProvider>
  )
}
