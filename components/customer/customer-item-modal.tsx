"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Clock, ImageIcon, Minus, Plus } from "lucide-react"
import { useState } from "react"
import type { MenuItem } from "@/lib/types/database"

interface CustomerItemModalProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart: (qty: number, notes: string) => void
}

export function CustomerItemModal({ item, open, onOpenChange, onAddToCart }: CustomerItemModalProps) {
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState("")

  const handleAdd = () => {
    onAddToCart(qty, notes)
    // Reset for next use
    setQty(1)
    setNotes("")
  }

  if (!item) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) {
          setQty(1)
          setNotes("")
        }
      }}
    >
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

        {/* Quantity Selector */}
        <div className="space-y-2">
          <Label>Quantity</Label>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-xl font-semibold w-12 text-center">{qty}</span>
            <Button variant="outline" size="icon" onClick={() => setQty(Math.min(99, qty + 1))} disabled={qty >= 99}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notes Input */}
        <div className="space-y-2">
          <Label htmlFor="notes">Special Instructions (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="e.g., No onions, Less spicy, Extra sauce"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">{notes.length}/200 characters</p>
        </div>

        {/* Add to Cart Button */}
        <Button onClick={handleAdd} size="lg" className="w-full">
          Add to Cart
        </Button>
      </DialogContent>
    </Dialog>
  )
}
