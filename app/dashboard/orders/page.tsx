"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock, Package, AlertCircle, ImageIcon } from "lucide-react"
import { useTenant } from "@/lib/hooks/use-tenant"
import {
  fetchTableOrdersSummary,
  fetchTableOrders,
  updateOrderStatus,
  type TableOrdersSummary,
  type OrderSummary,
} from "@/lib/orders/admin"
import { fetchOrder, subscribeToOrder, type OrderWithItems } from "@/lib/orders/fetch"
import { useToast } from "@/hooks/use-toast"

const STATUS_COLORS = {
  received: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
  preparing: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm",
  ready: "bg-gradient-to-r from-success to-green-600 text-white shadow-sm",
  sent_out: "bg-gradient-to-r from-primary to-primary/90 text-white shadow-sm shadow-primary/25",
  closed: "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm",
  cancelled: "bg-gradient-to-r from-destructive to-red-600 text-white shadow-sm",
}

const STATUS_TRANSITIONS = {
  received: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["sent_out"],
  sent_out: ["closed"],
  closed: [],
  cancelled: [],
}

export default function OrdersPage() {
  const { tenant, membership } = useTenant()
  const [mode, setMode] = useState<"overview" | "table">("overview")
  const [tablesSummary, setTablesSummary] = useState<TableOrdersSummary[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [tableOrders, setTableOrders] = useState<OrderSummary[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [orderDetails, setOrderDetails] = useState<OrderWithItems | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (tenant?.id) {
      loadTablesSummary()
    }
  }, [tenant?.id])

  useEffect(() => {
    if (selectedTableId && tenant?.id) {
      loadTableOrders(selectedTableId)
    }
  }, [selectedTableId, tenant?.id])

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrder(selectedOrderId).then(setOrderDetails)

      const unsubscribe = subscribeToOrder(selectedOrderId, (updatedOrder) => {
        setOrderDetails(updatedOrder)
        // Refresh summaries
        if (tenant?.id) {
          loadTablesSummary()
          if (selectedTableId) {
            loadTableOrders(selectedTableId)
          }
        }
      })

      return () => unsubscribe()
    }
  }, [selectedOrderId])

  const loadTablesSummary = async () => {
    if (!tenant?.id) return
    const summary = await fetchTableOrdersSummary(tenant.id)
    setTablesSummary(summary)
  }

  const loadTableOrders = async (tableId: string) => {
    if (!tenant?.id) return
    const orders = await fetchTableOrders(tenant.id, tableId)
    setTableOrders(orders)
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus)
    if (success) {
      toast({
        title: "Status updated",
        description: `Order status changed to ${newStatus}`,
      })
      if (selectedTableId) {
        loadTableOrders(selectedTableId)
      }
      if (selectedOrderId === orderId) {
        fetchOrder(orderId).then(setOrderDetails)
      }
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
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
          Order Master
        </h2>
        <p className="mt-2 text-muted-foreground">Manage and track all restaurant orders</p>
      </div>

      {mode === "overview" ? (
        /* Overview Mode */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tablesSummary.length === 0 ? (
            <Card className="col-span-full p-12 text-center">
              <p className="text-muted-foreground">No open orders</p>
            </Card>
          ) : (
            tablesSummary.map((table) => (
              <Card
                key={table.table_id}
                className="group relative cursor-pointer overflow-hidden border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
                onClick={() => {
                  setSelectedTableId(table.table_id)
                  setMode("table")
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{table.table_name}</h3>
                    {table.has_ready && (
                      <Badge className="bg-gradient-to-r from-success to-green-600 text-white shadow-sm">
                        <Package className="mr-1 h-3 w-3" />
                        Ready
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="rounded-full bg-primary/10 p-1">
                        <AlertCircle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{table.open_orders_count} open order(s)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Oldest: {table.oldest_order_age}m ago</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Table Detail Mode */
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setMode("overview")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Orders List */}
            <div className="space-y-4">
              {tableOrders.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No orders for this table</p>
                </Card>
              ) : (
                tableOrders.map((order) => (
                  <Card
                    key={order.id}
                    className={`p-4 cursor-pointer ${selectedOrderId === order.id ? "border-primary" : ""}`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                      <Badge className={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.item_count} item(s) • {order.age_minutes}m ago
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Order Detail */}
            {orderDetails && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Order #{orderDetails.id.slice(0, 8)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(orderDetails.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Status Control */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Update Status</label>
                    <Select
                      value={orderDetails.status}
                      onValueChange={(value) => handleStatusChange(orderDetails.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={orderDetails.status} disabled>
                          {orderDetails.status}
                        </SelectItem>
                        {STATUS_TRANSITIONS[orderDetails.status as keyof typeof STATUS_TRANSITIONS]?.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="font-medium mb-3">Items</h4>
                    <div className="space-y-3">
                      {orderDetails.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-muted rounded overflow-hidden">
                            {item.image_url_snapshot ? (
                              <img
                                src={item.image_url_snapshot || "/placeholder.svg"}
                                alt={item.title_snapshot}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">{item.title_snapshot}</p>
                              <span className="text-sm flex-shrink-0">x{item.qty}</span>
                            </div>
                            {item.notes && <p className="text-xs font-bold text-red-600 mt-1">{item.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Note */}
                  {orderDetails.customer_note && (
                    <div>
                      <h4 className="font-medium mb-2">Order Note</h4>
                      <p className="text-sm font-bold text-red-600">{orderDetails.customer_note}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
