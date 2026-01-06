"use client"

import { useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useTenant } from "@/lib/hooks/use-tenant"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CategoriesTab } from "@/components/menu/categories-tab"
import { SubcategoriesTab } from "@/components/menu/subcategories-tab"
import { ItemsTab } from "@/components/menu/items-tab"
import { Spinner } from "@/components/ui/spinner"
import { Eye, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function MenuMasterPage() {
  const router = useRouter()
  const { tenant, membership, permissions, isLoading: tenantLoading } = useTenant()
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!tenantLoading && permissions && !permissions.canViewMenu) {
      router.push("/dashboard")
    }
  }, [permissions, tenantLoading, router])

  if (tenantLoading || !tenant || !permissions) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!permissions.canViewMenu) {
    return null
  }

  const canManage = permissions.canManageMenu
  // </CHANGE>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Menu Master</h2>
          <p className="text-muted-foreground">
            {canManage ? "Manage categories, subcategories, and menu items" : "View menu items"}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => router.push("/dashboard/menu/preview")}>
            <Eye className="mr-2 h-4 w-4" />
            Preview Menu
          </Button>
        )}
      </div>

      {!canManage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You have read-only access to the menu. Contact an admin to make changes.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <CategoriesTab tenantId={tenant.id} isAdmin={canManage} />
        </TabsContent>

        <TabsContent value="subcategories" className="space-y-4">
          <SubcategoriesTab tenantId={tenant.id} isAdmin={canManage} />
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <ItemsTab tenantId={tenant.id} isAdmin={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
