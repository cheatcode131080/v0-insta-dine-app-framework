"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, ImageIcon, Minus, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCart, updateQty, updateNotes, removeItem, clearCart } from "@/lib/cart/storage"
import { createOrder } from "@/lib/orders/create"
import { useToast } from "@/hooks/use-toast"
import type { CartItem } from "@/lib/types/database"

interface CartClientProps {
  companyCode: string
  tableId: string
  restaurantName: string
  tableName: string
}

export function CartClient({ companyCode, tableId, restaurantName, tableName }: CartClientProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<{ itemId: string; addedAt: string; notes: string } | null>(null)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setCart(getCart(companyCode, tableId))
  }, [companyCode, tableId])

  const handleUpdateQty = (itemId: string, addedAt: string, newQty: number) => {
    updateQty(companyCode, tableId, itemId, addedAt, newQty)
    setCart(getCart(companyCode, tableId))
  }

  const handleRemove = (itemId: string, addedAt: string) => {
    removeItem(companyCode, tableId, itemId, addedAt)
    setCart(getCart(companyCode, tableId))
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart",
    })
  }

  const handleClearCart = () => {
    clearCart(companyCode, tableId)
    setCart([])
    setShowClearDialog(false)
    toast({
      title: "Cart cleared",
      description: "All items have been removed",
    })
  }

  const handleSaveNotes = () => {
    if (!editingNotes) return
    updateNotes(companyCode, tableId, editingNotes.itemId, editingNotes.addedAt, editingNotes.notes)
    setCart(getCart(companyCode, tableId))
    setEditingNotes(null)
    toast({
      title: "Notes updated",
      description: "Special instructions have been saved",
    })
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return

    setIsPlacingOrder(true)

    try {
      const orderItems = cart.map((item) => ({
        menu_item_id: item.item_id,
        title: item.title,
        image_url: item.image_url,
        qty: item.qty,
        notes: item.notes || undefined,
      }))

      const result = await createOrder({
        company_code: companyCode,
        table_id: tableId,
        items: orderItems,
      })

      clearCart(companyCode, tableId)

      router.push(`/t/${companyCode}/${tableId}/order/${result.order_id}`)
    } catch (error) {
      console.error("[v0] Order creation failed:", error)
      toast({
        title: "Order failed",
        description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
        variant: "destructive",
      })
      setIsPlacingOrder(false)
    }
  }

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href={`/t/${companyCode}/${tableId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Your Cart</h1>
              <p className="text-sm text-muted-foreground">
                {restaurantName} • {tableName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-6">
        {cart.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
            <Link href={`/t/${companyCode}/${tableId}`}>
              <Button>Browse Menu</Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-24">
              {cart.map((item) => {
                const isExpanded = expandedNotes === `${item.item_id}-${item.added_at}`
                const isEditing = editingNotes?.itemId === item.item_id && editingNotes?.addedAt === item.added_at

                return (
                  <Card key={`${item.item_id}-${item.added_at}`} className="p-4">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-md overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url || "/placeholder.svg"}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold">{item.title}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(item.item_id, item.added_at)}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => handleUpdateQty(item.item_id, item.added_at, Math.max(1, item.qty - 1))}
                            disabled={item.qty <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-base font-medium w-8 text-center">{item.qty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => handleUpdateQty(item.item_id, item.added_at, Math.min(99, item.qty + 1))}
                            disabled={item.qty >= 99}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Notes Section */}
                        {item.notes && !isEditing && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedNotes(isExpanded ? null : `${item.item_id}-${item.added_at}`)}
                              className="h-auto p-0 text-xs font-medium hover:bg-transparent"
                            >
                              Special instructions
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3 ml-1" />
                              ) : (
                                <ChevronDown className="w-3 h-3 ml-1" />
                              )}
                            </Button>
                            {isExpanded && (
                              <div className="mt-2 space-y-2">
                                <p className="text-sm font-bold text-red-600">{item.notes}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setEditingNotes({
                                      itemId: item.item_id,
                                      addedAt: item.added_at,
                                      notes: item.notes,
                                    })
                                  }
                                >
                                  Edit notes
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {isEditing && (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={editingNotes.notes}
                              onChange={(e) => setEditingNotes({ ...editingNotes, notes: e.target.value })}
                              placeholder="Add special instructions..."
                              rows={2}
                              maxLength={200}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveNotes}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingNotes(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {!item.notes && !isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingNotes({
                                itemId: item.item_id,
                                addedAt: item.added_at,
                                notes: "",
                              })
                            }
                            className="h-auto p-0 text-xs hover:bg-transparent"
                          >
                            Add special instructions
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
              <div className="container max-w-3xl mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Items: {totalItems}</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowClearDialog(true)}>
                    Clear Cart
                  </Button>
                </div>
                <Button size="lg" className="w-full" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                  {isPlacingOrder ? "Placing Order..." : "Place Order"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Clear Cart Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear cart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all items from your cart. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCart}>Clear cart</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
