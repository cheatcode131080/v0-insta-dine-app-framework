import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OnboardingClient } from "./client"

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user already has a tenant
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (membership) {
    redirect("/dashboard")
  }

  return <OnboardingClient />
}
