"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Ban, CheckCircle, LogIn, Users, Trash2 } from "lucide-react"
import {
  updateTenantStatusAction,
  updateTenantSupportNotesAction,
  enterTenantPanelAction,
  deleteTenantAction,
} from "@/lib/superadmin/actions"
import { useToast } from "@/hooks/use-toast"

export function TenantDetail({ tenant, members }: { tenant: any; members: any[] }) {
  const [notes, setNotes] = useState(tenant.support_notes || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSaveNotes = async () => {
    setIsSaving(true)
    const result = await updateTenantSupportNotesAction(tenant.id, notes)
    if (result.error) {
      toast({ title: "Failed to save notes", variant: "destructive" })
    } else {
      toast({ title: "Notes saved" })
      router.refresh()
    }
    setIsSaving(false)
  }

  const handleToggleStatus = async () => {
    const newStatus = tenant.status === "suspended" ? "active" : "suspended"
    const result = await updateTenantStatusAction(tenant.id, newStatus)

    if (result.error) {
      toast({ title: "Failed to update status", variant: "destructive" })
      return
    }

    toast({ title: `Tenant ${newStatus}` })
    router.refresh()
  }

  const handleEnterPanel = async () => {
    const result = await enterTenantPanelAction(tenant.id, tenant.slug, tenant.name)

    if (result.success) {
      localStorage.setItem("superadmin_support_mode", "true")
      localStorage.setItem("active_tenant_id", tenant.id)

      toast({ title: "Entering tenant panel", description: `Accessing ${tenant.name} as superadmin` })
      router.push("/dashboard")
    }
  }

  const handleDeleteTenant = async () => {
    setIsDeleting(true)
    const result = await deleteTenantAction(tenant.id)

    if (result.error) {
      toast({
        title: "Failed to delete tenant",
        description: result.error,
        variant: "destructive",
      })
      setIsDeleting(false)
      return
    }

    toast({ title: "Tenant deleted successfully" })
    router.push("/superadmin/tenants")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{tenant.name}</h1>
          <p className="text-muted-foreground">Company Code: {tenant.slug}</p>
        </div>
        <Badge variant={tenant.status === "suspended" ? "destructive" : "default"}>{tenant.status || "active"}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Created</Label>
              <p className="text-sm text-muted-foreground">{new Date(tenant.created_at).toLocaleString()}</p>
            </div>
            <div>
              <Label>Updated</Label>
              <p className="text-sm text-muted-foreground">{new Date(tenant.updated_at).toLocaleString()}</p>
            </div>
            <div>
              <Label>Status</Label>
              <p className="text-sm text-muted-foreground">{tenant.status || "active"}</p>
            </div>
            <div>
              <Label>Members</Label>
              <p className="text-sm text-muted-foreground">{members.length} users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={handleEnterPanel}>
              <LogIn className="h-4 w-4" />
              Enter Tenant Panel
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent"
              onClick={() => router.push(`/superadmin/tenants/${tenant.id}/users`)}
            >
              <Users className="h-4 w-4" />
              View Users
            </Button>
            <Button
              variant={tenant.status === "suspended" ? "default" : "destructive"}
              className="w-full justify-start gap-2"
              onClick={handleToggleStatus}
            >
              {tenant.status === "suspended" ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Activate Tenant
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" />
                  Suspend Tenant
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Tenant
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the tenant "{tenant.name}" and all
                    associated data including users, menus, orders, and tables.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteTenant}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {isDeleting ? "Deleting..." : "Delete Tenant"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Add internal support notes about this tenant..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
          />
          <Button onClick={handleSaveNotes} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
