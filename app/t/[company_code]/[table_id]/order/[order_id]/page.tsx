import { OrderConfirmationClient } from "./client"
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{
    company_code: string
    table_id: string
    order_id: string
  }>
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { company_code, table_id, order_id } = await params

  // Verify company and table exist
  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("id, name, slug").eq("slug", company_code).single()

  if (!tenant) {
    notFound()
  }

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, display_name")
    .eq("id", table_id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!table) {
    notFound()
  }

  return (
    <OrderConfirmationClient
      companyCode={company_code}
      tableId={table_id}
      orderId={order_id}
      restaurantName={tenant.name}
      tableName={table.display_name}
    />
  )
}
