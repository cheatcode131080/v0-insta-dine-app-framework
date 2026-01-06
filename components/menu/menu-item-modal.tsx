"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Clock, ImageIcon } from "lucide-react"
import type { MenuItem } from "@/lib/types/database"

interface MenuItemModalProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isPreviewMode?: boolean
}

export function MenuItemModal({ item, open, onOpenChange, isPreviewMode = false }: MenuItemModalProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Large Image */}
        <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden -mt-6 -mx-6 mb-4">
          {item.image_url ? (
            <img src={item.image_url || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl">{item.title}</DialogTitle>
            {item.is_featured && <Badge variant="default">Featured</Badge>}
          </div>
          {isPreviewMode && (
            <Badge variant="secondary" className="w-fit">
              Preview only – ordering disabled
            </Badge>
          )}
        </DialogHeader>

        {/* Description */}
        {item.description && (
          <DialogDescription className="text-base leading-relaxed">{item.description}</DialogDescription>
        )}

        {/* Preparation Time */}
        {item.preparation_time && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Prep time: {item.preparation_time} mins</span>
          </div>
        )}

        {/* Dietary Flags */}
        {item.dietary_flags && item.dietary_flags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Dietary Information</p>
            <div className="flex gap-2 flex-wrap">
              {item.dietary_flags.map((flag) => (
                <Badge key={flag} variant="outline">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Allergens */}
        {item.allergens && item.allergens.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-600">Allergen Information</p>
            <div className="flex gap-2 flex-wrap">
              {item.allergens.map((allergen) => (
                <Badge key={allergen} variant="destructive">
                  {allergen}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Price Placeholder */}
        <div className="h-6" />
      </DialogContent>
    </Dialog>
  )
}
