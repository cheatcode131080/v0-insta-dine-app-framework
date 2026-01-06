"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, Package, ImageIcon } from "lucide-react"
import { useTenant } from "@/lib/hooks/use-tenant"
import { fetchKitchenOrders, subscribeToKitchenOrders, type OrderWithItems } from "@/lib/orders/kitchen"
import { updateOrderStatus } from "@/lib/orders/admin"
import { useToast } from "@/hooks/use-toast"

function formatTimeAgo(timestamp: string): string {
  const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m ago`
}

export default function KitchenPage() {
  const { tenant, membership } = useTenant()
  const [receivedOrders, setReceivedOrders] = useState<OrderWithItems[]>([])
  const [preparingOrders, setPreparingOrders] = useState<OrderWithItems[]>([])
  const [readyOrders, setReadyOrders] = useState<OrderWithItems[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (tenant?.id) {
      loadOrders()

      const unsubscribe = subscribeToKitchenOrders(tenant.id, () => {
        loadOrders()
      })

      return () => unsubscribe()
    }
  }, [tenant?.id])

  const loadOrders = async () => {
    if (!tenant?.id) return

    const [received, preparing, ready] = await Promise.all([
      fetchKitchenOrders(tenant.id, "received"),
      fetchKitchenOrders(tenant.id, "preparing"),
      fetchKitchenOrders(tenant.id, "ready"),
    ])

    setReceivedOrders(received)
    setPreparingOrders(preparing)
    setReadyOrders(ready)
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus)
    if (success) {
      toast({
        title: "Status updated",
        description: `Order moved to ${newStatus}`,
      })
      loadOrders()
    } else {
      toast({
        title: "Update failed",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  if (!tenant) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kitchen Display</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const OrderCard = ({ order, actions }: { order: OrderWithItems; actions: React.ReactNode }) => (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold">{order.table.display_name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4" />
              {formatTimeAgo(order.created_at)}
            </p>
          </div>
          <Badge className="text-lg px-3 py-1" variant="outline">
            #{order.id.slice(0, 8)}
          </Badge>
        </div>

        {/* Items */}
        <div className="space-y-3 border-t pt-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-muted rounded overflow-hidden">
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
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-semibold">{item.title_snapshot}</p>
                  <span className="text-xl font-bold flex-shrink-0">x{item.qty}</span>
                </div>
                {item.notes && <p className="text-sm font-bold text-red-600 mt-1">{item.notes}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Customer Note */}
        {order.customer_note && (
          <div className="border-t pt-4">
            <p className="text-sm font-bold text-red-600">{order.customer_note}</p>
          </div>
        )}

        {/* Actions */}
        <div className="border-t pt-4">{actions}</div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Kitchen Display System</h2>
        <p className="text-muted-foreground">Manage incoming orders</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Received Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Received</h3>
            <Badge variant="secondary">{receivedOrders.length}</Badge>
          </div>
          {receivedOrders.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No received orders</Card>
          ) : (
            receivedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actions={
                  <Button
                    size="lg"
                    className="w-full text-lg h-14"
                    onClick={() => handleStatusChange(order.id, "preparing")}
                  >
                    <ChefHat className="w-5 h-5 mr-2" />
                    Start Prep
                  </Button>
                }
              />
            ))
          )}
        </div>

        {/* Preparing Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Preparing</h3>
            <Badge variant="secondary">{preparingOrders.length}</Badge>
          </div>
          {preparingOrders.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No orders preparing</Card>
          ) : (
            preparingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actions={
                  <Button
                    size="lg"
                    className="w-full text-lg h-14 bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange(order.id, "ready")}
                  >
                    <Package className="w-5 h-5 mr-2" />
                    Mark Ready
                  </Button>
                }
              />
            ))
          )}
        </div>

        {/* Ready Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Ready</h3>
            <Badge variant="secondary">{readyOrders.length}</Badge>
          </div>
          {readyOrders.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No orders ready</Card>
          ) : (
            readyOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actions={
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Waiting for server pickup</p>
                  </div>
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
