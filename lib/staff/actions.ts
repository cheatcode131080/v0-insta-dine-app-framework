"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function createStaffAccountAction(formData: {
  email: string
  fullName: string
  password: string
  role: string
}) {
  const supabase = await createServerClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: "Unauthorized" }
  }

  // Get admin's tenant
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", currentUser.id)
    .eq("is_active", true)
    .maybeSingle()

  if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
    return { error: "Insufficient permissions. Only owners, admins, and managers can create staff accounts." }
  }

  const adminClient = createAdminClient()

  const { data: existingProfile } = await adminClient
    .from("users")
    .select("id, email")
    .eq("email", formData.email)
    .maybeSingle()

  let userId: string

  if (existingProfile) {
    // User already exists, use their ID
    userId = existingProfile.id
    console.log("[v0] User already exists, adding to tenant:", formData.email)
  } else {
    // Create new user in Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
      user_metadata: {
        full_name: formData.fullName,
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    userId = authData.user.id

    // Create profile for new user
    const { error: profileError } = await adminClient.from("users").insert({
      id: userId,
      email: formData.email,
      full_name: formData.fullName,
      is_superadmin: false,
      is_disabled: false,
    })

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(userId)
      return { error: profileError.message }
    }
  }

  // Check if user is already a member of this tenant
  const { data: existingMembership } = await adminClient
    .from("tenant_members")
    .select("id, role")
    .eq("tenant_id", membership.tenant_id)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingMembership) {
    // Update their role instead of inserting
    const { error: updateError } = await adminClient
      .from("tenant_members")
      .update({ role: formData.role, is_active: true })
      .eq("id", existingMembership.id)

    if (updateError) {
      return { error: updateError.message }
    }
  } else {
    // Add as new tenant member
    const { error: memberError } = await adminClient.from("tenant_members").insert({
      tenant_id: membership.tenant_id,
      user_id: userId,
      role: formData.role,
      is_active: true,
    })

    if (memberError) {
      return { error: memberError.message }
    }
  }

  // Log activity
  await supabase.from("activity_log").insert({
    tenant_id: membership.tenant_id,
    user_id: currentUser.id,
    action: "staff_created",
    entity_type: "user",
    entity_id: userId,
    details: { email: formData.email, role: formData.role },
  })

  return { data: { id: userId, email: formData.email }, error: null }
}
