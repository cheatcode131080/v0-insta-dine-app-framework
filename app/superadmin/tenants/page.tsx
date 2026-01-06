import { createServerClient } from "@/lib/supabase/server"
import { TenantsTable } from "@/components/superadmin/tenants-table"

export default async function TenantsPage() {
  const supabase = await createServerClient()

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, status, created_at, updated_at")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tenants</h1>
        <p className="text-muted-foreground">Manage all restaurant tenants on the platform</p>
      </div>

      <TenantsTable initialTenants={tenants || []} />
    </div>
  )
}
