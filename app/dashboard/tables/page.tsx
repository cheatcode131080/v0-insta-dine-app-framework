"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useTenant } from "@/lib/hooks/use-tenant"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Plus, AlertCircle } from "lucide-react"
import { TableCanvas } from "@/components/tables/table-canvas"
import { TableListPanel } from "@/components/tables/table-list-panel"
import { TemplateUploadDialog } from "@/components/qr/template-upload-dialog"
import type { TableWithLayout } from "@/lib/types/database"
import { getTables, createTable, getNextTableNumber } from "@/lib/tables/tables"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TablesPage() {
  const router = useRouter()
  const { tenant, membership, permissions } = useTenant()
  const [tables, setTables] = useState<TableWithLayout[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBulkGenerating, setIsBulkGenerating] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (permissions && !permissions.canViewTables) {
      router.push("/dashboard")
    }
  }, [permissions, router])

  const canManage = permissions?.canManageTables ?? false

  useEffect(() => {
    if (tenant?.id) {
      loadTables()
    }
  }, [tenant?.id])

  async function loadTables() {
    if (!tenant?.id) return

    try {
      setIsLoading(true)
      const data = await getTables(tenant.id)
      setTables(data)
    } catch (error) {
      console.error("[v0] Error loading tables:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddTable() {
    if (!tenant?.id || !canManage) return

    try {
      const nextNumber = await getNextTableNumber(tenant.id)
      const displayName = `Table ${nextNumber}`

      await createTable(tenant.id, displayName, { x: 400, y: 300 })

      await loadTables()
    } catch (error) {
      console.error("[v0] Error adding table:", error)
    }
  }

  function handleTableSelect(tableId: string) {
    setSelectedTableId(tableId)
  }

  async function handleDownloadAllQRCodes() {
    if (!tenant?.id || !tenant?.slug || !canManage) return

    try {
      setIsBulkGenerating(true)

      const freshTables = await getTables(tenant.id)

      if (freshTables.length === 0) {
        alert("No tables found. Please create tables first.")
        return
      }

      let successCount = 0

      for (const table of freshTables) {
        try {
          const response = await fetch("/api/qr-codes/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId: tenant.id,
              tenantSlug: tenant.slug,
              tableId: table.id,
              tableName: table.display_name,
            }),
          })

          if (!response.ok) continue

          const data = await response.json()

          if (data.qrDataURL) {
            const link = document.createElement("a")
            link.href = data.qrDataURL
            link.download = `${table.display_name.replace(/\s+/g, "_")}_qr_code.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            successCount++
            await new Promise((resolve) => setTimeout(resolve, 200))
          }
        } catch (error) {
          console.error("[v0] Error generating QR for", table.display_name, error)
        }
      }

      alert(`Successfully generated ${successCount} QR codes`)
    } catch (error) {
      console.error("[v0] Error generating QR codes:", error)
      alert("Failed to generate QR codes")
    } finally {
      setIsBulkGenerating(false)
    }
  }

  if (!permissions?.canViewTables) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading tables...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Table Management</h2>
          <p className="text-muted-foreground">
            {canManage ? "Arrange your restaurant layout & generate QR codes" : "View restaurant table layout"}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <TemplateUploadDialog onSuccess={() => loadTables()} />
            <Button
              variant="outline"
              onClick={handleDownloadAllQRCodes}
              disabled={tables.length === 0 || isBulkGenerating}
            >
              <Download className="mr-2 h-4 w-4" />
              {isBulkGenerating ? "Generating..." : "Download All QR Codes"}
            </Button>
          </div>
        )}
      </div>

      {!canManage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You have read-only access to tables. Contact an admin to make changes.</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        {/* Canvas */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Table Layout</h3>
            {canManage && (
              <Button onClick={handleAddTable} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Table
              </Button>
            )}
          </div>
          <TableCanvas
            tables={tables}
            selectedTableId={selectedTableId}
            onTableSelect={handleTableSelect}
            onTablesChange={loadTables}
            isAdmin={canManage}
            tenantId={tenant?.id || ""}
          />
        </Card>

        {/* Table List */}
        <TableListPanel
          tables={tables}
          selectedTableId={selectedTableId}
          onTableSelect={handleTableSelect}
          onTablesChange={loadTables}
          isAdmin={canManage}
          tenantId={tenant?.id || ""}
          tenantSlug={tenant?.slug || ""}
        />
      </div>
    </div>
  )
}
