"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateTenantInfo } from "@/lib/settings/profile"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface RestaurantEditorProps {
  tenant: any
  canEdit: boolean
}

export function RestaurantEditor({ tenant, canEdit }: RestaurantEditorProps) {
  const [name, setName] = useState(tenant?.name || "")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!canEdit) return

    setLoading(true)
    try {
      await updateTenantInfo({
        name,
      })
      toast({
        title: "Success",
        description: "Restaurant information updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restaurant Information</CardTitle>
        <CardDescription>Basic information about your restaurant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="restaurantName">Restaurant Name</Label>
          <Input
            id="restaurantName"
            type="text"
            placeholder="Restaurant name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
          />
          {!canEdit && <p className="text-xs text-muted-foreground">Only owners and admins can edit</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={tenant?.slug} disabled />
          <p className="text-xs text-muted-foreground">Slug cannot be changed</p>
        </div>
        {tenant?.subdomain && (
          <div className="space-y-2">
            <Label>Subdomain</Label>
            <Input value={tenant.subdomain} disabled />
          </div>
        )}
        {canEdit && (
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
