"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createTenant(name: string, slug: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Check if slug is already taken
  const { data: existing } = await supabase.from("tenants").select("id").eq("slug", slug).single()

  if (existing) {
    throw new Error("This restaurant slug is already taken")
  }

  // Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      name,
      slug,
    })
    .select()
    .single()

  if (tenantError) throw tenantError

  // Add user as admin member
  const { error: memberError } = await supabase.from("tenant_members").insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: "admin",
    is_active: true,
  })

  if (memberError) throw memberError

  // Log activity
  await supabase.from("activity_log").insert({
    tenant_id: tenant.id,
    user_id: user.id,
    action: "tenant_created",
    details: { tenant_name: name, slug },
  })

  revalidatePath("/dashboard")
  return tenant
}

export async function getTenantBySlug(slug: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (error) throw error
  return data
}

export async function updateTenant(tenantId: string, updates: { name?: string }) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Check user is admin
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single()

  if (!membership || membership.role !== "admin") {
    throw new Error("Only admins can update restaurant information")
  }

  const { data, error } = await supabase.from("tenants").update(updates).eq("id", tenantId).select().single()

  if (error) throw error

  // Log activity
  await supabase.from("activity_log").insert({
    tenant_id: tenantId,
    user_id: user.id,
    action: "tenant_updated",
    details: { updates },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/settings")
  return data
}
