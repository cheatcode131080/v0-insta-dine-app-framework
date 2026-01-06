// Order fetching functions with realtime support
import { createBrowserClient } from "@/lib/supabase/client"

export interface OrderWithItems {
  id: string
  tenant_id: string
  table_id: string
  status: string
  source: string
  customer_note: string | null
  created_at: string
  updated_at: string
  items: Array<{
    id: string
    menu_item_id: string | null
    title_snapshot: string
    description_snapshot: string | null
    image_url_snapshot: string | null
    qty: number
    notes: string | null
  }>
  table: {
    display_name: string
  }
}

export async function fetchOrder(orderId: string): Promise<OrderWithItems | null> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*),
      table:restaurant_tables(display_name)
    `,
    )
    .eq("id", orderId)
    .single()

  if (error) {
    console.error("[v0] Error fetching order:", error)
    return null
  }

  return data as OrderWithItems
}

export function subscribeToOrder(orderId: string, callback: (order: OrderWithItems) => void) {
  const supabase = createBrowserClient()

  const channel = supabase
    .channel(`order:${orderId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => {
      // Refetch order when it changes
      fetchOrder(orderId).then((order) => {
        if (order) callback(order)
      })
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
