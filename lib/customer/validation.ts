"use server"

import { createPublicClient } from "@/lib/supabase/server"
import type { Tenant, RestaurantTable } from "@/lib/types/database"

export interface ValidationResult {
  valid: boolean
  tenant?: Tenant
  table?: RestaurantTable
  error?: string
}

export async function validateTableAccess(companyCode: string, tableId: string): Promise<ValidationResult> {
  console.log("[v0] validateTableAccess called with companyCode:", companyCode, "tableId:", tableId)

  const supabase = createPublicClient()

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .ilike("slug", companyCode)
    .single()

  console.log("[v0] Tenant lookup result:", { tenant: tenant?.name, error: tenantError?.message })

  if (tenantError || !tenant) {
    return {
      valid: false,
      error: "Invalid restaurant code",
    }
  }

  // Validate table exists for this tenant
  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("id", tableId)
    .eq("tenant_id", tenant.id)
    .single()

  console.log("[v0] Table lookup result:", { table: table?.display_name, error: tableError?.message })

  if (tableError || !table) {
    return {
      valid: false,
      error: "Invalid table",
    }
  }

  return {
    valid: true,
    tenant,
    table,
  }
}
