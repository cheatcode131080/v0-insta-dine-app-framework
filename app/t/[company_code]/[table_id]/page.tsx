import { validateTableAccess } from "@/lib/customer/validation"
import { createPublicClient } from "@/lib/supabase/server"
import { getMenuPreview } from "@/lib/menu/preview"
import { ErrorScreen } from "@/components/customer/error-screen"
import { CustomerMenuClient } from "./client"

interface PageProps {
  params: Promise<{
    company_code: string
    table_id: string
  }>
}

export default async function CustomerMenuPage({ params }: PageProps) {
  const { company_code, table_id } = await params

  console.log("[v0] CustomerMenuPage called with company_code:", company_code, "table_id:", table_id)

  // Validate tenant and table
  const validation = await validateTableAccess(company_code, table_id)

  console.log("[v0] Validation result:", { valid: validation.valid, error: validation.error })

  if (!validation.valid || !validation.tenant || !validation.table) {
    return <ErrorScreen title="Invalid Table QR Code" message={validation.error || "Please ask staff for help"} />
  }

  const supabase = createPublicClient()
  let menuData

  try {
    menuData = await getMenuPreview(supabase, validation.tenant.id)
    console.log("[v0] Menu loaded successfully, categories count:", menuData.categories.length)
  } catch (error) {
    console.error("[v0] Error loading menu:", error)
    return <ErrorScreen title="Menu Unavailable" message="Unable to load the menu. Please try again." />
  }

  // Check if menu is empty
  if (!menuData.categories || menuData.categories.length === 0) {
    return (
      <ErrorScreen
        title="Menu Not Available"
        message="The restaurant menu is currently being updated. Please check back soon."
      />
    )
  }

  return (
    <CustomerMenuClient
      companyCode={company_code}
      tableId={table_id}
      restaurantName={validation.tenant.name}
      tableName={validation.table.display_name}
      menuData={menuData}
    />
  )
}
