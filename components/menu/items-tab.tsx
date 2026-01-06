"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { listCategories } from "@/lib/menu/categories"
import { listSubcategories } from "@/lib/menu/subcategories"
import { listItems, deleteItem } from "@/lib/menu/items"
import type { MenuCategory, MenuSubcategory, MenuItem } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Search, ImageIcon } from "lucide-react"
import { ItemDialog } from "./item-dialog"
import { DeleteDialog } from "./delete-dialog"
import { useToast } from "@/hooks/use-toast"

interface ItemsTabProps {
  tenantId: string
  isAdmin: boolean
}

export function ItemsTab({ tenantId, isAdmin }: ItemsTabProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [subcategories, setSubcategories] = useState<MenuSubcategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [tenantId])

  useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId)
      loadItems()
    } else {
      setSubcategories([])
      setSelectedSubcategoryId("")
    }
  }, [selectedCategoryId])

  useEffect(() => {
    if (selectedCategoryId) {
      loadItems()
    }
  }, [selectedSubcategoryId, searchQuery])

  async function loadCategories() {
    try {
      const data = await listCategories(supabase, tenantId)
      setCategories(data)
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id)
      }
    } catch (error: any) {
      console.error("[v0] Error loading categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadSubcategories(categoryId: string) {
    try {
      const data = await listSubcategories(supabase, tenantId, categoryId)
      setSubcategories(data)
    } catch (error: any) {
      console.error("[v0] Error loading subcategories:", error)
    }
  }

  async function loadItems() {
    if (!selectedCategoryId) return

    try {
      console.log("[v0] Loading items for category:", selectedCategoryId)
      console.log("[v0] Tenant ID:", tenantId)
      console.log("[v0] Filters:", {
        categoryId: selectedCategoryId,
        subcategoryId: selectedSubcategoryId || undefined,
        search: searchQuery || undefined,
      })

      const data = await listItems(supabase, tenantId, {
        categoryId: selectedCategoryId,
        subcategoryId: selectedSubcategoryId || undefined,
        search: searchQuery || undefined,
      })

      console.log("[v0] Items loaded:", data.length)
      setItems(data)
    } catch (error: any) {
      console.error("[v0] Error loading items:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load items",
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    if (!selectedItem) return

    try {
      await deleteItem(supabase, tenantId, selectedItem.id)
      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
      loadItems()
      setDeleteDialogOpen(false)
      setSelectedItem(null)
    } catch (error: any) {
      console.error("[v0] Error deleting item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Please create categories first before adding menu items.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSubcategoryId} onValueChange={setSelectedSubcategoryId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All subcategories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subcategories</SelectItem>
            {subcategories.map((subcategory) => (
              <SelectItem key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No items found</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
                  <Badge variant={item.is_available ? "default" : "secondary"} className="shrink-0">
                    {item.is_available ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {item.description && (
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">${item.price.toFixed(2)}</p>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem(item)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItem(item)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ItemDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelectedItem(null)
        }}
        tenantId={tenantId}
        categories={categories}
        subcategories={subcategories}
        item={selectedItem}
        onSave={loadItems}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Item"
        description="Are you sure you want to delete this menu item? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  )
}
