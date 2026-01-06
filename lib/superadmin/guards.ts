import { createServerClient } from "@/lib/supabase/server"

export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase.from("users").select("is_superadmin").eq("id", user.id).single()

  return profile?.is_superadmin === true
}

export async function requireSuperAdmin() {
  const isSuper = await isSuperAdmin()

  if (!isSuper) {
    throw new Error("Unauthorized: Superadmin access required")
  }

  return true
}
