import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SuperAdminShell } from "@/components/superadmin/shell"

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("users").select("is_superadmin, email").eq("id", user.id).single()

  if (!profile?.is_superadmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="rounded-lg border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Unauthorized</h1>
          <p className="mt-2 text-muted-foreground">You do not have access to the Super Admin panel.</p>
        </div>
      </div>
    )
  }

  return <SuperAdminShell userEmail={profile.email}>{children}</SuperAdminShell>
}
