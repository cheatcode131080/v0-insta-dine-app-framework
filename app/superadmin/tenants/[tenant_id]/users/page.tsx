import { createServerClient } from "@/lib/supabase/server"
import { TenantUsers } from "@/components/superadmin/tenant-users"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function TenantUsersPage({ params }: { params: { tenant_id: string } }) {
  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("id, name, slug").eq("id", params.tenant_id).single()

  if (!tenant) {
    notFound()
  }

  const { data: members } = await supabase
    .from("tenant_members")
    .select("*, users(*)")
    .eq("tenant_id", params.tenant_id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/superadmin/tenants/${params.tenant_id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{tenant.name} - Users</h1>
          <p className="text-muted-foreground">Manage user access and permissions</p>
        </div>
      </div>

      <TenantUsers tenantId={tenant.id} initialMembers={members || []} />
    </div>
  )
}
