import { createServerClient } from "@/lib/supabase/server"

export async function getTenants() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, status, support_notes, created_at, updated_at")
    .order("created_at", { ascending: false })

  return { data, error }
}

export async function getTenant(tenantId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase.from("tenants").select("*").eq("id", tenantId).single()

  return { data, error }
}

export async function getTenantUsers(tenantId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("tenant_members")
    .select(
      `
      user_id,
      role,
      is_active,
      joined_at,
      users (
        id,
        email,
        full_name,
        is_disabled,
        last_login_at
      )
    `,
    )
    .eq("tenant_id", tenantId)
    .order("joined_at", { ascending: false })

  return { data, error }
}
