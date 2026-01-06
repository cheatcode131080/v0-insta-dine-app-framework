"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function updateUserProfile(updates: { full_name?: string; phone?: string }) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from("users").update(updates).eq("id", user.id)

  if (error) throw error

  return { success: true }
}

export async function updateTenantInfo(updates: { name?: string; logo_url?: string }) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Get user's tenant
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Insufficient permissions")
  }

  const { error } = await supabase.from("tenants").update(updates).eq("id", membership.tenant_id)

  if (error) throw error

  // Log activity
  await supabase.from("activity_log").insert({
    tenant_id: membership.tenant_id,
    user_id: user.id,
    action: "tenant_updated",
    entity_type: "tenant",
    entity_id: membership.tenant_id,
    details: updates,
  })

  return { success: true }
}
