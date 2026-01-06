// Phase 6: Order Creation Edge Function
// Handles public order creation with validation and tenant safety

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/node/global.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface OrderItem {
  menu_item_id: string
  title: string
  description?: string
  image_url?: string
  qty: number
  notes?: string
}

interface CreateOrderRequest {
  company_code: string
  table_id: string
  items: OrderItem[]
  customer_note?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { company_code, table_id, items, customer_note }: CreateOrderRequest = await req.json()

    // Validation
    if (!company_code || !table_id || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Basic abuse protection
    if (items.length > 50) {
      return new Response(JSON.stringify({ error: "Too many items (max 50)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Validate item quantities
    for (const item of items) {
      if (!item.menu_item_id || !item.title || !item.qty) {
        return new Response(JSON.stringify({ error: "Invalid item data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      if (item.qty < 1 || item.qty > 99) {
        return new Response(JSON.stringify({ error: "Invalid quantity (1-99)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Verify tenant exists and get tenant_id
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", company_code)
      .single()

    if (tenantError || !tenant) {
      return new Response(JSON.stringify({ error: "Invalid company code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Verify table belongs to tenant
    const { data: table, error: tableError } = await supabaseAdmin
      .from("restaurant_tables")
      .select("id")
      .eq("id", table_id)
      .eq("tenant_id", tenant.id)
      .single()

    if (tableError || !table) {
      return new Response(JSON.stringify({ error: "Invalid table" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        tenant_id: tenant.id,
        table_id: table_id,
        status: "received",
        source: "qr",
        customer_note: customer_note || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order creation error:", orderError)
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create order items
    const orderItems = items.map((item) => ({
      tenant_id: tenant.id,
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      title_snapshot: item.title,
      description_snapshot: item.description || null,
      image_url_snapshot: item.image_url || null,
      qty: item.qty,
      notes: item.notes || null,
    }))

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Order items creation error:", itemsError)
      // Rollback: delete the order
      await supabaseAdmin.from("orders").delete().eq("id", order.id)
      return new Response(JSON.stringify({ error: "Failed to create order items" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Return success
    return new Response(
      JSON.stringify({
        order_id: order.id,
        created_at: order.created_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Unexpected error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
