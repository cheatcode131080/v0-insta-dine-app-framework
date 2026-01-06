"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye } from "lucide-react"

interface AuditLog {
  id: string
  actor_type: string
  action: string
  metadata: any
  created_at: string
  tenants?: { name: string; slug: string }
  users?: { email: string }
}

interface Tenant {
  id: string
  name: string
  slug: string
}

export function AuditLogViewer({ initialLogs, tenants }: { initialLogs: AuditLog[]; tenants: Tenant[] }) {
  const [logs] = useState(initialLogs)
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [tenantFilter, setTenantFilter] = useState<string>("all")

  const actions = Array.from(new Set(logs.map((log) => log.action)))

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesTenant = tenantFilter === "all" || log.tenants?.slug === tenantFilter
    return matchesAction && matchesTenant
  })

  const getActionColor = (action: string) => {
    if (action.includes("SUSPEND") || action.includes("DISABLE")) return "destructive"
    if (action.includes("CREATE") || action.includes("ACTIVATE") || action.includes("ENABLE")) return "default"
    return "secondary"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Audit Trail</CardTitle>
          <div className="flex gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.slug}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead className="text-right">Metadata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
                  </TableCell>
                  <TableCell>{log.tenants ? `${log.tenants.name} (${log.tenants.slug})` : "-"}</TableCell>
                  <TableCell className="text-sm">{log.users?.email || "System"}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Audit Log Metadata</DialogTitle>
                        </DialogHeader>
                        <pre className="rounded-md bg-muted p-4 text-sm overflow-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
