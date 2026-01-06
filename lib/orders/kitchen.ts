// Kitchen-specific order functions
import { createBrowserClient } from "@/lib/supabase/client"
import type { OrderWithItems } from "./fetch"

export async function fetchKitchenOrders(tenantId: string, status: string): Promise<OrderWithItems[]> {
  const supabase = createBrowserClient()

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*),
      table:restaurant_tables(display_name)
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("status", status)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching kitchen orders:", error)
    return []
  }

  return orders as OrderWithItems[]
}

export async function fetchReadyOrders(tenantId: string): Promise<OrderWithItems[]> {
  const supabase = createBrowserClient()

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*),
      table:restaurant_tables(display_name)
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("status", "ready")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching ready orders:", error)
    return []
  }

  return orders as OrderWithItems[]
}

export function subscribeToKitchenOrders(tenantId: string, callback: () => void) {
  const supabase = createBrowserClient()

  const channel = supabase
    .channel("kitchen-orders")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `tenant_id=eq.${tenantId}`,
      },
      callback,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
