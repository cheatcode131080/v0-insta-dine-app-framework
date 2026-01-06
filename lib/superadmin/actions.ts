"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

// Audit logging action
export async function writeAuditLogAction(params: {
  action: string
  tenant_id?: string
  metadata?: Record<string, any>
  actor_type?: "superadmin" | "admin" | "user"
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No authenticated user" }
  }

  const { error } = await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    actor_type: params.actor_type || "superadmin",
    tenant_id: params.tenant_id || null,
    action: params.action,
    metadata: params.metadata || {},
  })

  if (error) {
    console.error("[Audit] Failed to write audit log:", error)
    return { error: error.message }
  }

  return { success: true }
}

// Create tenant action
export async function createTenantServerAction(formData: { name: string; slug: string }) {
  const supabase = await createServerClient()

  // Check if slug already exists
  const { data: existing } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", formData.slug.toUpperCase())
    .single()

  if (existing) {
    return { error: "Company code already exists" }
  }

  const { data, error } = await supabase
    .from("tenants")
    .insert({
      name: formData.name,
      slug: formData.slug.toUpperCase(),
      status: "active",
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log the action
  await writeAuditLogAction({
    action: "TENANT_CREATE",
    tenant_id: data.id,
    metadata: { company_code: data.slug, tenant_name: data.name },
  })

  revalidatePath("/superadmin/tenants")
  return { data, error: null }
}

// Create tenant action with owner
export async function createTenantWithOwnerAction(formData: {
  name: string
  slug: string
  ownerName: string
  ownerEmail: string
  ownerPassword: string
}) {
  const supabase = await createServerClient()
  const adminClient = createAdminClient()

  console.log("[v0] Starting tenant creation process...")

  // Check if company code already exists
  const { data: existing } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", formData.slug.toUpperCase())
    .maybeSingle()

  if (existing) {
    console.log("[v0] Company code already exists")
    return { error: "Company code already exists" }
  }

  let tenantId: string | null = null
  let userId: string | null = null

  try {
    // Step 1: Create tenant
    console.log("[v0] Creating tenant...")
    const { data: tenant, error: tenantError } = await adminClient
      .from("tenants")
      .insert({
        name: formData.name,
        slug: formData.slug.toUpperCase(),
        status: "active",
      })
      .select()
      .single()

    if (tenantError) {
      console.error("[v0] Tenant creation error:", tenantError)
      return { error: `Failed to create tenant: ${tenantError.message}` }
    }

    tenantId = tenant.id
    console.log("[v0] Tenant created successfully with ID:", tenantId)

    // Step 2: Try to create auth user (or find existing)
    console.log("[v0] Creating owner auth account...")
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: formData.ownerEmail,
      password: formData.ownerPassword,
      email_confirm: true,
      user_metadata: {
        full_name: formData.ownerName,
      },
    })

    if (authError) {
      // Check if user already exists
      if (authError.message?.includes("already") || authError.message?.includes("email_exists")) {
        console.log("[v0] User already exists in auth, finding existing user...")

        // Try to find the existing user by email in the users table
        const { data: existingProfile, error: profileLookupError } = await adminClient
          .from("users")
          .select("id, email")
          .eq("email", formData.ownerEmail)
          .maybeSingle()

        if (profileLookupError) {
          console.error("[v0] Profile lookup error:", profileLookupError)
          return { error: `Failed to look up existing user: ${profileLookupError.message}` }
        }

        if (existingProfile) {
          userId = existingProfile.id
          console.log("[v0] Found existing user with ID:", userId)
        } else {
          // User exists in auth but not in users table - this is a problem
          console.error("[v0] User exists in auth but has no profile")
          return {
            error: `Email ${formData.ownerEmail} is already registered but has no profile. Please contact support.`,
          }
        }
      } else {
        console.error("[v0] Auth creation error:", authError)
        throw new Error(`Failed to create owner account: ${authError.message}`)
      }
    } else {
      userId = authData.user.id
      console.log("[v0] Auth user created with ID:", userId)

      // Create profile for new user
      console.log("[v0] Creating profile...")
      const { error: profileError } = await adminClient.from("users").insert({
        id: userId,
        email: formData.ownerEmail,
        full_name: formData.ownerName,
        is_superadmin: false,
        is_disabled: false,
      })

      if (profileError) {
        // Profile might already exist due to a trigger, that's okay
        if (profileError.code === "23505") {
          console.log("[v0] Profile already exists (possibly from trigger), continuing...")
        } else {
          console.error("[v0] Profile creation error:", profileError)
          return { error: `Failed to create profile: ${profileError.message}` }
        }
      } else {
        console.log("[v0] Profile created successfully")
      }
    }

    // Step 3: Add as tenant member
    console.log("[v0] Adding owner as tenant member...")

    // Check if already a member
    const { data: existingMember } = await adminClient
      .from("tenant_members")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .maybeSingle()

    if (existingMember) {
      console.log("[v0] User is already a member, updating role to owner...")
      const { error: updateError } = await adminClient
        .from("tenant_members")
        .update({ role: "owner", is_active: true })
        .eq("id", existingMember.id)

      if (updateError) {
        console.error("[v0] Member update error:", updateError)
        throw new Error(`Failed to update member role: ${updateError.message}`)
      }
    } else {
      const { error: memberError } = await adminClient.from("tenant_members").insert({
        tenant_id: tenantId,
        user_id: userId,
        role: "owner",
        is_active: true,
      })

      if (memberError) {
        console.error("[v0] Member creation error:", memberError)
        throw new Error(`Failed to add owner to tenant: ${memberError.message}`)
      }
    }

    console.log("[v0] Owner successfully added to tenant")

    // Step 4: Log the action
    await writeAuditLogAction({
      action: "TENANT_CREATE",
      tenant_id: tenantId,
      metadata: {
        company_code: formData.slug.toUpperCase(),
        tenant_name: formData.name,
        owner_email: formData.ownerEmail,
        owner_name: formData.ownerName,
      },
    })

    console.log("[v0] Tenant and owner created successfully!")
    revalidatePath("/superadmin/tenants")
    return { data: { id: tenantId, name: formData.name, slug: formData.slug.toUpperCase() }, error: null }
  } catch (error: any) {
    console.error("[v0] Error during tenant creation:", error)

    // Rollback: Delete tenant if it was created
    if (tenantId) {
      console.log("[v0] Rolling back, deleting tenant...")
      await adminClient.from("tenants").delete().eq("id", tenantId)
    }

    return { error: error.message || "Failed to create tenant and owner" }
  }
}

// Update tenant status action
export async function updateTenantStatusAction(tenantId: string, status: "active" | "suspended") {
  const supabase = await createServerClient()

  const { error } = await supabase.from("tenants").update({ status }).eq("id", tenantId)

  if (error) {
    return { error: error.message }
  }

  // Log the action
  await writeAuditLogAction({
    action: status === "suspended" ? "TENANT_SUSPEND" : "TENANT_ACTIVATE",
    tenant_id: tenantId,
    metadata: { new_status: status },
  })

  revalidatePath("/superadmin/tenants")
  revalidatePath(`/superadmin/tenants/${tenantId}`)
  return { error: null }
}

// Update tenant support notes action
export async function updateTenantSupportNotesAction(tenantId: string, notes: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.from("tenants").update({ support_notes: notes }).eq("id", tenantId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/superadmin/tenants/${tenantId}`)
  return { error: null }
}

// Disable/enable user action
export async function toggleUserStatusAction(userId: string, disabled: boolean, tenantId?: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.from("users").update({ is_disabled: disabled }).eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  // Log the action
  await writeAuditLogAction({
    action: disabled ? "USER_DISABLE" : "USER_ENABLE",
    tenant_id: tenantId,
    metadata: { user_id: userId, disabled },
  })

  if (tenantId) {
    revalidatePath(`/superadmin/tenants/${tenantId}/users`)
  }
  return { error: null }
}

// Enter tenant panel in support mode
export async function enterTenantPanelAction(tenantId: string, tenantSlug: string, tenantName: string) {
  // Log the action
  await writeAuditLogAction({
    action: "TENANT_ENTER",
    tenant_id: tenantId,
    metadata: { company_code: tenantSlug, tenant_name: tenantName },
  })

  // Return the tenant info to be stored in client
  return { tenantId, success: true }
}

// Create user action for superadmin
export async function createUserForTenantAction(formData: {
  tenantId: string
  email: string
  fullName: string
  password: string
  role: string
}) {
  const adminClient = createAdminClient()

  console.log("[v0] Creating user for tenant:", formData.email)

  let userId: string

  try {
    // Attempt to create new user in auth...
    console.log("[v0] Attempting to create new user in auth...")
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
      user_metadata: {
        full_name: formData.fullName,
      },
    })

    if (authError) {
      if (authError.message?.includes("already") || authError.message?.includes("email_exists")) {
        console.log("[v0] User already exists in auth, looking up by email in users table...")

        // Try to find existing user by email in the users table
        const { data: existingProfile, error: profileLookupError } = await adminClient
          .from("users")
          .select("id, email")
          .eq("email", formData.email)
          .maybeSingle()

        if (profileLookupError) {
          console.error("[v0] Profile lookup error:", profileLookupError)
          return { error: `Failed to look up existing user: ${profileLookupError.message}` }
        }

        if (existingProfile) {
          userId = existingProfile.id
          console.log("[v0] Found existing user with ID:", userId)
        } else {
          // User exists in auth but has no profile - this is a problem
          console.error("[v0] User exists in auth but has no profile")
          return { error: `Email ${formData.email} is already registered but has no profile. Please contact support.` }
        }
      } else {
        console.error("[v0] Auth creation error:", authError)
        return { error: `Failed to create user: ${authError.message}` }
      }
    } else {
      userId = authData.user.id
      console.log("[v0] User created in auth with ID:", userId)

      // Create profile for new user
      console.log("[v0] Creating profile...")
      const { error: profileError } = await adminClient.from("users").insert({
        id: userId,
        email: formData.email,
        full_name: formData.fullName,
        is_superadmin: false,
        is_disabled: false,
      })

      if (profileError) {
        // Profile might already exist due to a trigger, that's okay
        if (profileError.code === "23505") {
          console.log("[v0] Profile already exists (possibly from trigger), continuing...")
        } else {
          console.error("[v0] Profile creation error:", profileError)
          return { error: `Failed to create profile: ${profileError.message}` }
        }
      } else {
        console.log("[v0] Profile created successfully")
      }
    }

    console.log("[v0] Checking if user is already a member of tenant...")

    // Check if user is already a member of this tenant
    const { data: existingMember } = await adminClient
      .from("tenant_members")
      .select("id")
      .eq("tenant_id", formData.tenantId)
      .eq("user_id", userId)
      .maybeSingle()

    if (existingMember) {
      console.log("[v0] User is already a member, updating role...")
      const { error: updateError } = await adminClient
        .from("tenant_members")
        .update({ role: formData.role, is_active: true })
        .eq("id", existingMember.id)

      if (updateError) {
        console.error("[v0] Member update error:", updateError)
        return { error: `Failed to update member role: ${updateError.message}` }
      }
    } else {
      console.log("[v0] Adding user to tenant...")
      const { error: memberError } = await adminClient.from("tenant_members").insert({
        tenant_id: formData.tenantId,
        user_id: userId,
        role: formData.role,
        is_active: true,
      })

      if (memberError) {
        console.error("[v0] Member creation error:", memberError)
        return { error: `Failed to add user to tenant: ${memberError.message}` }
      }
    }

    console.log("[v0] User successfully added to tenant")

    // Log the action
    await writeAuditLogAction({
      action: "USER_CREATE",
      tenant_id: formData.tenantId,
      metadata: {
        user_id: userId,
        email: formData.email,
        role: formData.role,
      },
    })

    revalidatePath(`/superadmin/tenants/${formData.tenantId}/users`)
    return { data: { id: userId, email: formData.email }, error: null }
  } catch (error: any) {
    console.error("[v0] Unexpected error in createUserForTenantAction:", error)
    return { error: error.message || "An unexpected error occurred while creating the user" }
  }
}

// Delete tenant action
export async function deleteTenantAction(tenantId: string) {
  const adminClient = createAdminClient()
  const supabase = await createServerClient()

  // Check if user is superadmin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No authenticated user" }
  }

  const { data: profile } = await supabase.from("users").select("is_superadmin").eq("id", user.id).single()

  if (!profile?.is_superadmin) {
    return { error: "Unauthorized" }
  }

  // Get tenant info for logging
  const { data: tenant } = await adminClient.from("tenants").select("name, slug").eq("id", tenantId).single()

  // Delete tenant (cascades to related tables)
  const { error } = await adminClient.from("tenants").delete().eq("id", tenantId)

  if (error) {
    console.error("[v0] Delete tenant error:", error)
    return { error: error.message }
  }

  // Log the action
  await writeAuditLogAction({
    action: "TENANT_DELETE",
    tenant_id: tenantId,
    metadata: {
      tenant_name: tenant?.name,
      company_code: tenant?.slug,
    },
  })

  revalidatePath("/superadmin/tenants")
  return { error: null }
}
