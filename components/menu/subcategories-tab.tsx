"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { listCategories } from "@/lib/menu/categories"
import { listSubcategories, createSubcategory, updateSubcategory, deleteSubcategory } from "@/lib/menu/subcategories"
import type { MenuCategory, MenuSubcategory } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { SubcategoryDialog } from "./subcategory-dialog"
import { DeleteDialog } from "./delete-dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface SubcategoriesTabProps {
  tenantId: string
  isAdmin: boolean
}

export function SubcategoriesTab({ tenantId, isAdmin }: SubcategoriesTabProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [subcategories, setSubcategories] = useState<MenuSubcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<MenuSubcategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSubcategory, setSelectedSubcategory] = useState<MenuSubcategory | null>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [tenantId])

  useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId)
    } else {
      setSubcategories([])
      setFilteredSubcategories([])
    }
  }, [selectedCategoryId])

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
      setFilteredSubcategories(data)
    } catch (error: any) {
      console.error("[v0] Error loading subcategories:", error)
      toast({
        title: "Error",
        description: "Failed to load subcategories",
        variant: "destructive",
      })
    }
  }

  async function handleCreate(data: Omit<MenuSubcategory, "id" | "tenant_id" | "created_at">) {
    try {
      await createSubcategory(supabase, tenantId, data)
      toast({
        title: "Success",
        description: "Subcategory created successfully",
      })
      loadSubcategories(selectedCategoryId)
      setDialogOpen(false)
    } catch (error: any) {
      console.error("[v0] Error creating subcategory:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create subcategory",
        variant: "destructive",
      })
    }
  }

  async function handleUpdate(data: Partial<MenuSubcategory>) {
    if (!selectedSubcategory) return

    try {
      await updateSubcategory(supabase, tenantId, selectedSubcategory.id, data)
      toast({
        title: "Success",
        description: "Subcategory updated successfully",
      })
      loadSubcategories(selectedCategoryId)
      setDialogOpen(false)
      setSelectedSubcategory(null)
    } catch (error: any) {
      console.error("[v0] Error updating subcategory:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update subcategory",
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    if (!selectedSubcategory) return

    try {
      await deleteSubcategory(supabase, tenantId, selectedSubcategory.id)
      toast({
        title: "Success",
        description: "Subcategory deleted successfully",
      })
      loadSubcategories(selectedCategoryId)
      setDeleteDialogOpen(false)
      setSelectedSubcategory(null)
    } catch (error: any) {
      console.error("[v0] Error deleting subcategory:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete subcategory",
        variant: "destructive",
      })
    }
  }

  async function handleToggleActive(subcategory: MenuSubcategory) {
    try {
      await updateSubcategory(supabase, tenantId, subcategory.id, { is_active: !subcategory.is_active })
      loadSubcategories(selectedCategoryId)
    } catch (error: any) {
      console.error("[v0] Error toggling subcategory:", error)
      toast({
        title: "Error",
        description: "Failed to update subcategory",
        variant: "destructive",
      })
    }
  }

  async function handleMove(subcategory: MenuSubcategory, direction: "up" | "down") {
    const currentIndex = subcategories.findIndex((s) => s.id === subcategory.id)
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === subcategories.length - 1)
    ) {
      return
    }

    const newSubcategories = [...subcategories]
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    ;[newSubcategories[currentIndex], newSubcategories[swapIndex]] = [
      newSubcategories[swapIndex],
      newSubcategories[currentIndex],
    ]

    newSubcategories[currentIndex].sort_order = currentIndex
    newSubcategories[swapIndex].sort_order = swapIndex

    setSubcategories(newSubcategories)

    try {
      await Promise.all([
        updateSubcategory(supabase, tenantId, newSubcategories[currentIndex].id, {
          sort_order: currentIndex,
        }),
        updateSubcategory(supabase, tenantId, newSubcategories[swapIndex].id, {
          sort_order: swapIndex,
        }),
      ])
    } catch (error: any) {
      console.error("[v0] Error reordering:", error)
      loadSubcategories(selectedCategoryId)
      toast({
        title: "Error",
        description: "Failed to reorder subcategories",
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
        Please create categories first before adding subcategories.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && selectedCategoryId && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subcategory
          </Button>
        )}
      </div>

      {selectedCategoryId && (
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
              {filteredSubcategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No subcategories found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubcategories.map((subcategory, index) => (
                  <TableRow key={subcategory.id}>
                    <TableCell className="font-medium">{subcategory.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={subcategory.is_active}
                        onCheckedChange={() => handleToggleActive(subcategory)}
                        disabled={!isAdmin}
                      />
                    </TableCell>
                    <TableCell>{subcategory.sort_order}</TableCell>
                    <TableCell>{new Date(subcategory.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMove(subcategory, "up")}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMove(subcategory, "down")}
                              disabled={index === filteredSubcategories.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSubcategory(subcategory)
                                setDialogOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSubcategory(subcategory)
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
      )}

      <SubcategoryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelectedSubcategory(null)
        }}
        categoryId={selectedCategoryId}
        subcategory={selectedSubcategory}
        onSave={selectedSubcategory ? handleUpdate : handleCreate}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Subcategory"
        description="Are you sure you want to delete this subcategory? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  )
}
