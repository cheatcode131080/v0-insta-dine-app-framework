// Admin order management functions
import { createBrowserClient } from "@/lib/supabase/client"

export interface OrderSummary {
  id: string
  table_id: string
  table_name: string
  status: string
  item_count: number
  created_at: string
  age_minutes: number
}

export interface TableOrdersSummary {
  table_id: string
  table_name: string
  open_orders_count: number
  oldest_order_age: number
  has_ready: boolean
}

export async function fetchTableOrdersSummary(tenantId: string): Promise<TableOrdersSummary[]> {
  const supabase = createBrowserClient()

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      table_id,
      status,
      created_at,
      table:restaurant_tables(display_name)
    `,
    )
    .eq("tenant_id", tenantId)
    .not("status", "in", '("closed","cancelled")')
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching orders summary:", error)
    return []
  }

  // Group by table
  const tableMap = new Map<string, TableOrdersSummary>()

  for (const order of orders as any[]) {
    if (!tableMap.has(order.table_id)) {
      tableMap.set(order.table_id, {
        table_id: order.table_id,
        table_name: order.table.display_name,
        open_orders_count: 0,
        oldest_order_age: 0,
        has_ready: false,
      })
    }

    const summary = tableMap.get(order.table_id)!
    summary.open_orders_count++

    const age = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
    summary.oldest_order_age = Math.max(summary.oldest_order_age, age)

    if (order.status === "ready") {
      summary.has_ready = true
    }
  }

  return Array.from(tableMap.values())
}

export async function fetchTableOrders(tenantId: string, tableId: string): Promise<OrderSummary[]> {
  const supabase = createBrowserClient()

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      table_id,
      status,
      created_at,
      table:restaurant_tables(display_name),
      items:order_items(id)
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("table_id", tableId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching table orders:", error)
    return []
  }

  return (orders as any[]).map((order) => ({
    id: order.id,
    table_id: order.table_id,
    table_name: order.table.display_name,
    status: order.status,
    item_count: order.items.length,
    created_at: order.created_at,
    age_minutes: Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000),
  }))
}

export async function updateOrderStatus(orderId: string, newStatus: string): Promise<boolean> {
  const supabase = createBrowserClient()

  const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

  if (error) {
    console.error("[v0] Error updating order status:", error)
    return false
  }

  return true
}
