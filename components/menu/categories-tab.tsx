"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { listCategories, createCategory, updateCategory, deleteCategory } from "@/lib/menu/categories"
import type { MenuCategory } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Search } from "lucide-react"
import { CategoryDialog } from "./category-dialog"
import { DeleteDialog } from "./delete-dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface CategoriesTabProps {
  tenantId: string
  isAdmin: boolean
}

export function CategoriesTab({ tenantId, isAdmin }: CategoriesTabProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<MenuCategory[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [tenantId])

  useEffect(() => {
    if (searchQuery) {
      setFilteredCategories(categories.filter((cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase())))
    } else {
      setFilteredCategories(categories)
    }
  }, [searchQuery, categories])

  async function loadCategories() {
    try {
      const data = await listCategories(supabase, tenantId)
      setCategories(data)
      setFilteredCategories(data)
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

  async function handleCreate(data: Omit<MenuCategory, "id" | "tenant_id" | "created_at" | "updated_at">) {
    try {
      await createCategory(supabase, tenantId, data)
      toast({
        title: "Success",
        description: "Category created successfully",
      })
      loadCategories()
      setDialogOpen(false)
    } catch (error: any) {
      console.error("[v0] Error creating category:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      })
    }
  }

  async function handleUpdate(data: Partial<MenuCategory>) {
    if (!selectedCategory) return

    try {
      await updateCategory(supabase, tenantId, selectedCategory.id, data)
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
      loadCategories()
      setDialogOpen(false)
      setSelectedCategory(null)
    } catch (error: any) {
      console.error("[v0] Error updating category:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    if (!selectedCategory) return

    try {
      await deleteCategory(supabase, tenantId, selectedCategory.id)
      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
      loadCategories()
      setDeleteDialogOpen(false)
      setSelectedCategory(null)
    } catch (error: any) {
      console.error("[v0] Error deleting category:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete category. It may have items or subcategories.",
        variant: "destructive",
      })
    }
  }

  async function handleToggleActive(category: MenuCategory) {
    try {
      await updateCategory(supabase, tenantId, category.id, { is_active: !category.is_active })
      loadCategories()
    } catch (error: any) {
      console.error("[v0] Error toggling category:", error)
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
    }
  }

  async function handleMove(category: MenuCategory, direction: "up" | "down") {
    const currentIndex = categories.findIndex((c) => c.id === category.id)
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === categories.length - 1)
    ) {
      return
    }

    const newCategories = [...categories]
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    ;[newCategories[currentIndex], newCategories[swapIndex]] = [newCategories[swapIndex], newCategories[currentIndex]]

    // Update sort_order for both
    newCategories[currentIndex].sort_order = currentIndex
    newCategories[swapIndex].sort_order = swapIndex

    setCategories(newCategories)

    try {
      await Promise.all([
        updateCategory(supabase, tenantId, newCategories[currentIndex].id, {
          sort_order: currentIndex,
        }),
        updateCategory(supabase, tenantId, newCategories[swapIndex].id, {
          sort_order: swapIndex,
        }),
      ])
    } catch (error: any) {
      console.error("[v0] Error reordering:", error)
      loadCategories() // Reload on error
      toast({
        title: "Error",
        description: "Failed to reorder categories",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={category.is_active}
                      onCheckedChange={() => handleToggleActive(category)}
                      disabled={!isAdmin}
                    />
                  </TableCell>
                  <TableCell>{category.sort_order}</TableCell>
                  <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMove(category, "up")}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMove(category, "down")}
                            disabled={index === filteredCategories.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCategory(category)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCategory(category)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelectedCategory(null)
        }}
        category={selectedCategory}
        onSave={selectedCategory ? handleUpdate : handleCreate}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  )
}
