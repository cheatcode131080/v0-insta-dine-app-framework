"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { RestaurantTable, TableWithLayout } from "@/lib/types/database"

export async function getTables(tenantId: string): Promise<TableWithLayout[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select(`
      *,
      layout:table_layouts(*)
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching tables:", error)
    throw new Error("Failed to fetch tables")
  }

  return (data || []).map((table: any) => ({
    ...table,
    layout: Array.isArray(table.layout) ? table.layout[0] : table.layout,
  }))
}

export async function createTable(
  tenantId: string,
  displayName: string,
  position?: { x: number; y: number },
): Promise<RestaurantTable> {
  const supabase = await createServerSupabaseClient()

  // Create table
  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .insert({
      tenant_id: tenantId,
      display_name: displayName,
    })
    .select()
    .single()

  if (tableError) {
    console.error("[v0] Error creating table:", tableError)
    throw new Error("Failed to create table")
  }

  // Create layout if position provided
  if (position) {
    const { error: layoutError } = await supabase.from("table_layouts").insert({
      tenant_id: tenantId,
      table_id: table.id,
      x: position.x,
      y: position.y,
      radius: 30,
    })

    if (layoutError) {
      console.error("[v0] Error creating layout:", layoutError)
      // Don't throw - table was created successfully
    }
  }

  return table
}

export async function updateTableName(tableId: string, displayName: string): Promise<void> {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from("restaurant_tables").update({ display_name: displayName }).eq("id", tableId)

  if (error) {
    console.error("[v0] Error updating table:", error)
    throw new Error("Failed to update table")
  }
}

export async function deleteTable(tableId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()

  console.log("[v0] Attempting to delete table:", tableId)

  // First, delete any related table_layouts
  const { error: layoutError } = await supabase.from("table_layouts").delete().eq("table_id", tableId)

  if (layoutError) {
    console.error("[v0] Error deleting table layout:", layoutError)
    // Continue anyway - layout might not exist
  }

  // Delete any order_items for orders at this table first
  const { data: tableOrders } = await supabase.from("orders").select("id").eq("table_id", tableId)

  if (tableOrders && tableOrders.length > 0) {
    const orderIds = tableOrders.map((o) => o.id)

    // Delete order items for these orders
    const { error: orderItemsError } = await supabase.from("order_items").delete().in("order_id", orderIds)

    if (orderItemsError) {
      console.error("[v0] Error deleting order items:", orderItemsError)
    }

    // Delete the orders
    const { error: ordersError } = await supabase.from("orders").delete().eq("table_id", tableId)

    if (ordersError) {
      console.error("[v0] Error deleting orders:", ordersError)
    }
  }

  // Now delete the table itself
  const { error } = await supabase.from("restaurant_tables").delete().eq("id", tableId)

  if (error) {
    console.error("[v0] Error deleting table:", error)
    throw new Error("Failed to delete table: " + error.message)
  }

  console.log("[v0] Table deleted successfully:", tableId)
}

export async function getNextTableNumber(tenantId: string): Promise<number> {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from("restaurant_tables")
    .select("display_name")
    .eq("tenant_id", tenantId)
    .ilike("display_name", "Table %")

  if (!data || data.length === 0) return 1

  const numbers = data
    .map((t) => {
      const match = t.display_name.match(/Table (\d+)/)
      return match ? Number.parseInt(match[1]) : 0
    })
    .filter((n) => n > 0)

  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1
}
