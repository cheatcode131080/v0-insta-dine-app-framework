"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { createItem, updateItem, uploadItemImage } from "@/lib/menu/items"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import type { MenuCategory, MenuSubcategory, MenuItem } from "@/lib/types/database"
import { Upload, X } from "lucide-react"

interface ItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  categories: MenuCategory[]
  subcategories: MenuSubcategory[]
  item: MenuItem | null
  onSave: () => void
}

export function ItemDialog({ open, onOpenChange, tenantId, categories, subcategories, item, onSave }: ItemDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    category_id: "",
    subcategory_id: "",
    image_url: "",
    is_available: true,
    is_featured: false,
    sort_order: 0,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description || "",
        price: item.price,
        category_id: item.category_id || "",
        subcategory_id: item.subcategory_id || "none",
        image_url: item.image_url || "",
        is_available: item.is_available,
        is_featured: item.is_featured,
        sort_order: item.sort_order,
      })
      setImagePreview(item.image_url || "")
    } else {
      setFormData({
        title: "",
        description: "",
        price: 0,
        category_id: categories[0]?.id || "",
        subcategory_id: "none",
        image_url: "",
        is_available: true,
        is_featured: false,
        sort_order: 0,
      })
      setImagePreview("")
    }
    setImageFile(null)
  }, [item, open, categories])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview("")
    setFormData({ ...formData, image_url: "" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Submitting item:", formData)

      let imageUrl = formData.image_url

      const itemData: any = {
        ...formData,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id === "none" ? null : formData.subcategory_id || null,
      }

      let itemId = item?.id

      if (item) {
        console.log("[v0] Updating existing item:", item.id)
        await updateItem(supabase, tenantId, item.id, itemData)
      } else {
        console.log("[v0] Creating new item")
        const newItem = await createItem(supabase, tenantId, itemData)
        itemId = newItem.id
        console.log("[v0] New item created with ID:", itemId)
      }

      // Upload image if there's a new file
      if (imageFile && itemId) {
        console.log("[v0] Uploading image for item:", itemId)
        imageUrl = await uploadItemImage(supabase, tenantId, itemId, imageFile)
        console.log("[v0] Image uploaded:", imageUrl)
        // Update item with image URL
        await updateItem(supabase, tenantId, itemId, { image_url: imageUrl })
      }

      toast({
        title: "Success",
        description: `Item ${item ? "updated" : "created"} successfully`,
      })

      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Error saving item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredSubcategories = subcategories.filter((s) => s.category_id === formData.category_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value, subcategory_id: "none" })}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={formData.subcategory_id}
                onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-md p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Label htmlFor="image-upload" className="cursor-pointer text-sm text-muted-foreground">
                  Click to upload image
                </Label>
                <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_available">Available</Label>
            <Switch
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_featured">Featured</Label>
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : item ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
