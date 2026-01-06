"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { MenuSubcategory } from "@/lib/types/database"

interface SubcategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: string
  subcategory: MenuSubcategory | null
  onSave: (data: any) => void
}

export function SubcategoryDialog({ open, onOpenChange, categoryId, subcategory, onSave }: SubcategoryDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    category_id: categoryId,
    is_active: true,
    sort_order: 0,
  })

  useEffect(() => {
    if (subcategory) {
      setFormData({
        name: subcategory.name,
        category_id: subcategory.category_id,
        is_active: subcategory.is_active,
        sort_order: subcategory.sort_order,
      })
    } else {
      setFormData({
        name: "",
        category_id: categoryId,
        is_active: true,
        sort_order: 0,
      })
    }
  }, [subcategory, categoryId, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subcategory ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{subcategory ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
