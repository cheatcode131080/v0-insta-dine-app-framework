"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Clock, ChefHat, UtensilsCrossed, Package, ImageIcon } from "lucide-react"
import Link from "next/link"
import { fetchOrder, subscribeToOrder, type OrderWithItems } from "@/lib/orders/fetch"

interface OrderConfirmationClientProps {
  companyCode: string
  tableId: string
  orderId: string
  restaurantName: string
  tableName: string
}

const STATUS_CONFIG = {
  received: { label: "Received", icon: Clock, color: "bg-blue-500" },
  preparing: { label: "Preparing", icon: ChefHat, color: "bg-orange-500" },
  ready: { label: "Ready", icon: Package, color: "bg-green-500" },
  sent_out: { label: "Sent Out", icon: UtensilsCrossed, color: "bg-purple-500" },
  closed: { label: "Completed", icon: CheckCircle2, color: "bg-gray-500" },
  cancelled: { label: "Cancelled", icon: CheckCircle2, color: "bg-red-500" },
}

export function OrderConfirmationClient({
  companyCode,
  tableId,
  orderId,
  restaurantName,
  tableName,
}: OrderConfirmationClientProps) {
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    fetchOrder(orderId).then((data) => {
      setOrder(data)
      setIsLoading(false)
    })

    // Subscribe to realtime updates
    const unsubscribe = subscribeToOrder(orderId, (updatedOrder) => {
      setOrder(updatedOrder)
    })

    return () => {
      unsubscribe()
    }
  }, [orderId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-lg mb-4">Order not found</p>
          <Link href={`/t/${companyCode}/${tableId}`}>
            <Button>Back to Menu</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.received
  const StatusIcon = statusConfig.icon

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
              <h1 className="text-lg font-bold">Order Confirmation</h1>
              <p className="text-sm text-muted-foreground">
                {restaurantName} • {tableName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Success Message */}
        <Card className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Order Received!</h2>
          <p className="text-muted-foreground mb-4">Your order has been sent to the kitchen</p>
          <div className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8)}</div>
        </Card>

        {/* Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${statusConfig.color} flex items-center justify-center`}>
                <StatusIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <p className="text-lg font-semibold">{statusConfig.label}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Live updates
            </Badge>
          </div>
        </Card>

        {/* Order Items */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Order Details</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-md overflow-hidden">
                  {item.image_url_snapshot ? (
                    <img
                      src={item.image_url_snapshot || "/placeholder.svg"}
                      alt={item.title_snapshot}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.title_snapshot}</p>
                      {item.description_snapshot && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{item.description_snapshot}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium flex-shrink-0">x{item.qty}</span>
                  </div>
                  {item.notes && <p className="text-sm font-bold text-red-600 mt-1">{item.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Customer Note */}
        {order.customer_note && (
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Order Note</h3>
            <p className="text-sm font-bold text-red-600">{order.customer_note}</p>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={`/t/${companyCode}/${tableId}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Back to Menu
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
