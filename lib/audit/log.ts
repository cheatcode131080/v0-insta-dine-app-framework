import { createServerClient } from "@/lib/supabase/server"

export interface WriteAuditLogParams {
  action: string
  tenant_id?: string
  metadata?: Record<string, any>
  actor_type?: "superadmin" | "admin" | "user"
}

export async function writeAuditLog(params: WriteAuditLogParams) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("[Audit] No authenticated user for audit log")
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
    return { error }
  }

  return { success: true }
}
