"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { TableLayout } from "@/lib/types/database"

export async function updateTablePosition(tableId: string, tenantId: string, x: number, y: number): Promise<void> {
  const supabase = await createServerSupabaseClient()

  // Check if layout exists
  const { data: existing } = await supabase.from("table_layouts").select("id").eq("table_id", tableId).single()

  if (existing) {
    // Update existing layout
    const { error } = await supabase.from("table_layouts").update({ x, y }).eq("table_id", tableId)

    if (error) {
      console.error("[v0] Error updating layout:", error)
      throw new Error("Failed to update table position")
    }
  } else {
    // Create new layout
    const { error } = await supabase.from("table_layouts").insert({
      tenant_id: tenantId,
      table_id: tableId,
      x,
      y,
      radius: 30,
    })

    if (error) {
      console.error("[v0] Error creating layout:", error)
      throw new Error("Failed to create table layout")
    }
  }
}

export async function getTableLayout(tableId: string): Promise<TableLayout | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("table_layouts").select("*").eq("table_id", tableId).single()

  if (error) {
    console.error("[v0] Error fetching layout:", error)
    return null
  }

  return data
}
