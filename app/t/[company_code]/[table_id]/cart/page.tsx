import { validateTableAccess } from "@/lib/customer/validation"
import { ErrorScreen } from "@/components/customer/error-screen"
import { CartClient } from "./client"

interface PageProps {
  params: Promise<{
    company_code: string
    table_id: string
  }>
}

export default async function CartPage({ params }: PageProps) {
  const { company_code, table_id } = await params

  // Validate tenant and table
  const validation = await validateTableAccess(company_code, table_id)

  if (!validation.valid || !validation.tenant || !validation.table) {
    return <ErrorScreen title="Invalid Table QR Code" message={validation.error || "Please ask staff for help"} />
  }

  return (
    <CartClient
      companyCode={company_code}
      tableId={table_id}
      restaurantName={validation.tenant.name}
      tableName={validation.table.display_name}
    />
  )
}
