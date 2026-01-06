// Order creation client library
export interface CreateOrderItem {
  menu_item_id: string
  title: string
  description?: string
  image_url?: string
  qty: number
  notes?: string
}

export interface CreateOrderRequest {
  company_code: string
  table_id: string
  items: CreateOrderItem[]
  customer_note?: string
}

export interface CreateOrderResponse {
  order_id: string
  created_at: string
}

export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-order`

  const response = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create order")
  }

  return response.json()
}
