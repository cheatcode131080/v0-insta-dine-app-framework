"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateTenantDialog } from "@/components/superadmin/create-tenant-dialog"
import { Search, Eye, LogIn } from "lucide-react"
import { enterTenantPanelAction } from "@/lib/superadmin/actions"
import { useToast } from "@/hooks/use-toast"

interface Tenant {
  id: string
  name: string
  slug: string
  status?: string
  created_at: string
  updated_at: string
}

export function TenantsTable({ initialTenants }: { initialTenants: Tenant[] }) {
  const [tenants, setTenants] = useState(initialTenants)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all")
  const router = useRouter()
  const { toast } = useToast()

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || tenant.status === statusFilter || (!tenant.status && statusFilter === "active")
    return matchesSearch && matchesStatus
  })

  const handleEnterPanel = async (tenant: Tenant) => {
    try {
      const result = await enterTenantPanelAction(tenant.id, tenant.slug, tenant.name)

      if (result.success) {
        // Store support mode in localStorage
        localStorage.setItem("superadmin_support_mode", "true")
        localStorage.setItem("active_tenant_id", tenant.id)

        toast({ title: "Entering tenant panel", description: `Accessing ${tenant.name} as superadmin` })
        router.push("/dashboard")
      }
    } catch (error) {
      toast({ title: "Failed to enter panel", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tenant Directory</CardTitle>
            <CreateTenantDialog onTenantCreated={(newTenant) => setTenants([newTenant, ...tenants])} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or company code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "suspended" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("suspended")}
              >
                Suspended
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant Name</TableHead>
                <TableHead>Company Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm">{tenant.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === "suspended" ? "destructive" : "default"}>
                        {tenant.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/superadmin/tenants/${tenant.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEnterPanel(tenant)}>
                          <LogIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
