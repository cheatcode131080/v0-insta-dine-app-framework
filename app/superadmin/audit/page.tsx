import { createServerClient } from "@/lib/supabase/server"
import { AuditLogViewer } from "@/components/superadmin/audit-log-viewer"

export default async function AuditLogsPage() {
  const supabase = await createServerClient()

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, tenants(name, slug), users(email)")
    .order("created_at", { ascending: false })
    .limit(100)

  const { data: tenants } = await supabase.from("tenants").select("id, name, slug").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">View all superadmin actions and system events</p>
      </div>

      <AuditLogViewer initialLogs={logs || []} tenants={tenants || []} />
    </div>
  )
}
