"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit2, Trash2, QrCode } from "lucide-react"
import type { TableWithLayout } from "@/lib/types/database"
import { deleteTable, updateTableName } from "@/lib/tables/tables"
import { cn } from "@/lib/utils"

interface TableListPanelProps {
  tables: TableWithLayout[]
  selectedTableId: string | null
  onTableSelect: (tableId: string) => void
  onTablesChange: () => void
  isAdmin: boolean
  tenantId: string
  tenantSlug: string
}

export function TableListPanel({
  tables,
  selectedTableId,
  onTableSelect,
  onTablesChange,
  isAdmin,
  tenantId,
  tenantSlug,
}: TableListPanelProps) {
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; tableId: string; currentName: string } | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tableId: string; name: string } | null>(null)
  const [newName, setNewName] = useState("")
  const [generatingQR, setGeneratingQR] = useState<string | null>(null)
  const [qrDialog, setQrDialog] = useState<{
    open: boolean
    qrUrl: string
    qrDataURL: string
    tableName: string
  } | null>(null)

  async function handleRename() {
    if (!renameDialog || !newName.trim()) return

    try {
      await updateTableName(renameDialog.tableId, newName.trim())
      setRenameDialog(null)
      setNewName("")
      onTablesChange()
    } catch (error) {
      console.error("[v0] Error renaming table:", error)
    }
  }

  async function handleDelete() {
    if (!deleteDialog) return

    try {
      await deleteTable(deleteDialog.tableId)
      setDeleteDialog(null)
      onTablesChange()
    } catch (error) {
      console.error("[v0] Error deleting table:", error)
    }
  }

  async function handleGenerateQR(table: TableWithLayout) {
    try {
      setGeneratingQR(table.id)
      console.log("[v0] Generating QR for table:", table.display_name)

      const response = await fetch("/api/qr-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          tenantSlug,
          tableId: table.id,
          tableName: table.display_name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] QR generation failed:", error)
        throw new Error(error.error || "Failed to generate QR code")
      }

      const data = await response.json()
      console.log("[v0] QR Code generated successfully")

      setQrDialog({
        open: true,
        qrUrl: data.qrUrl,
        qrDataURL: data.qrDataURL,
        tableName: table.display_name,
      })
    } catch (error) {
      console.error("[v0] Error generating QR:", error)
      alert("Failed to generate QR code. Please try again.")
    } finally {
      setGeneratingQR(null)
    }
  }

  function handleDownloadQR() {
    if (!qrDialog) return
    const link = document.createElement("a")
    link.href = qrDialog.qrDataURL
    link.download = `${qrDialog.tableName.replace(/\s+/g, "_")}_qr_code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tables ({tables.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tables.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No tables yet. Add your first table!</p>
          ) : (
            tables.map((table) => (
              <div
                key={table.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50",
                  selectedTableId === table.id && "border-primary bg-muted",
                )}
                onClick={() => onTableSelect(table.id)}
              >
                <span className="font-medium">{table.display_name}</span>
                <div className="flex gap-1">
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRenameDialog({
                            open: true,
                            tableId: table.id,
                            currentName: table.display_name,
                          })
                          setNewName(table.display_name)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteDialog({
                            open: true,
                            tableId: table.id,
                            name: table.display_name,
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleGenerateQR(table)
                    }}
                    disabled={generatingQR === table.id}
                  >
                    {generatingQR === table.id ? (
                      <span className="h-4 w-4 animate-spin">⏳</span>
                    ) : (
                      <QrCode className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={renameDialog?.open || false} onOpenChange={(open) => !open && setRenameDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Table</DialogTitle>
            <DialogDescription>Enter a new name for this table</DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter table name"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog?.open || false} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Display Dialog */}
      <Dialog open={qrDialog?.open || false} onOpenChange={(open) => !open && setQrDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Generated</DialogTitle>
            <DialogDescription>QR code for {qrDialog?.tableName}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrDialog && (
              <img
                src={qrDialog.qrDataURL || "/placeholder.svg"}
                alt="QR Code"
                className="h-64 w-64 rounded-lg border-2 border-border"
              />
            )}
            <p className="text-center text-sm text-muted-foreground">
              Scan this QR code to view the menu for this table
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setQrDialog(null)}>
              Close
            </Button>
            <Button onClick={handleDownloadQR}>Download QR Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
