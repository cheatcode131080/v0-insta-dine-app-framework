import { createServerClient } from "@/lib/supabase/server"
import { TenantDetail } from "@/components/superadmin/tenant-detail"
import { notFound } from "next/navigation"

export default async function TenantDetailPage({ params }: { params: { tenant_id: string } }) {
  const supabase = await createServerClient()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", params.tenant_id).single()

  if (!tenant) {
    notFound()
  }

  const { data: members } = await supabase
    .from("tenant_members")
    .select("*, users(*)")
    .eq("tenant_id", params.tenant_id)

  return <TenantDetail tenant={tenant} members={members || []} />
}
