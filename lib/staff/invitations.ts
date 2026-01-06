"use server"

import { createServerClient } from "@/lib/supabase/server"
import { randomBytes } from "crypto"

export async function inviteStaff(email: string, role: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Get tenant
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Insufficient permissions")
  }

  // Generate invitation token
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  // Create invitation
  const { data, error } = await supabase
    .from("staff_invitations")
    .insert({
      tenant_id: membership.tenant_id,
      email,
      role,
      invited_by: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // Log activity
  await supabase.from("activity_log").insert({
    tenant_id: membership.tenant_id,
    user_id: user.id,
    action: "staff_invited",
    entity_type: "staff_invitation",
    entity_id: data.id,
    details: { email, role },
  })

  return data
}

export async function resendInvitation(invitationId: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Update token and expiry
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await supabase
    .from("staff_invitations")
    .update({
      token,
      expires_at: expiresAt.toISOString(),
      status: "pending",
    })
    .eq("id", invitationId)

  if (error) throw error

  return { success: true }
}

export async function cancelInvitation(invitationId: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase.from("staff_invitations").delete().eq("id", invitationId)

  if (error) throw error

  return { success: true }
}

export async function updateStaffMember(memberId: string, updates: { role?: string; is_active?: boolean }) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Get admin's membership
  const { data: adminMembership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!adminMembership || !["owner", "admin"].includes(adminMembership.role)) {
    throw new Error("Insufficient permissions")
  }

  const { error } = await supabase.from("tenant_members").update(updates).eq("id", memberId)

  if (error) throw error

  // Log activity
  await supabase.from("activity_log").insert({
    tenant_id: adminMembership.tenant_id,
    user_id: user.id,
    action: "staff_updated",
    entity_type: "tenant_member",
    entity_id: memberId,
    details: updates,
  })

  return { success: true }
}

export async function removeStaffMember(memberId: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Get admin's membership
  const { data: adminMembership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  if (!adminMembership || !["owner", "admin"].includes(adminMembership.role)) {
    throw new Error("Insufficient permissions")
  }

  // Deactivate instead of delete
  const { error } = await supabase.from("tenant_members").update({ is_active: false }).eq("id", memberId)

  if (error) throw error

  // Log activity
  await supabase.from("activity_log").insert({
    tenant_id: adminMembership.tenant_id,
    user_id: user.id,
    action: "staff_removed",
    entity_type: "tenant_member",
    entity_id: memberId,
  })

  return { success: true }
}
