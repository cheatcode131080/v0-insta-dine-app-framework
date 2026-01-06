"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, UtensilsCrossed, Clock, ImageIcon } from "lucide-react"
import { useTenant } from "@/lib/hooks/use-tenant"
import { fetchReadyOrders, subscribeToKitchenOrders, type OrderWithItems } from "@/lib/orders/kitchen"
import { fetchTableOrdersSummary, type TableOrdersSummary } from "@/lib/orders/admin"
import { updateOrderStatus } from "@/lib/orders/admin"
import { useToast } from "@/hooks/use-toast"

function formatTimeAgo(timestamp: string): string {
  const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m ago`
}

export default function ServersPage() {
  const { tenant, membership } = useTenant()
  const [readyOrders, setReadyOrders] = useState<OrderWithItems[]>([])
  const [tablesSummary, setTablesSummary] = useState<TableOrdersSummary[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (tenant?.id) {
      loadData()

      const unsubscribe = subscribeToKitchenOrders(tenant.id, () => {
        loadData()
      })

      return () => unsubscribe()
    }
  }, [tenant?.id])

  const loadData = async () => {
    if (!tenant?.id) return

    const [ready, tables] = await Promise.all([fetchReadyOrders(tenant.id), fetchTableOrdersSummary(tenant.id)])

    setReadyOrders(ready)
    setTablesSummary(tables)
  }

  const handleMarkSentOut = async (orderId: string) => {
    const success = await updateOrderStatus(orderId, "sent_out")
    if (success) {
      toast({
        title: "Order sent out",
        description: "Order has been marked as sent to table",
      })
      loadData()
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
          <h2 className="text-3xl font-bold tracking-tight">Server View</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Server View</h2>
        <p className="text-muted-foreground">Ready orders and table status</p>
      </div>

      <Tabs defaultValue="ready" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ready">
            Ready Queue
            {readyOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {readyOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tables">Table Lookup</TabsTrigger>
        </TabsList>

        <TabsContent value="ready" className="space-y-4">
          {readyOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No orders ready for pickup</p>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {readyOrders.map((order) => (
                <Card key={order.id} className="p-6">
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
                      <Badge className="bg-green-500">
                        <Package className="w-4 h-4 mr-1" />
                        Ready
                      </Badge>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 border-t pt-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="flex-shrink-0 w-14 h-14 bg-muted rounded overflow-hidden">
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
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold">{item.title_snapshot}</p>
                              <span className="font-bold flex-shrink-0">x{item.qty}</span>
                            </div>
                            {item.notes && <p className="text-xs font-bold text-red-600 mt-1">{item.notes}</p>}
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

                    {/* Action */}
                    <div className="border-t pt-4">
                      <Button
                        size="lg"
                        className="w-full text-lg h-14 bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleMarkSentOut(order.id)}
                      >
                        <UtensilsCrossed className="w-5 h-5 mr-2" />
                        Mark Sent Out
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          {tablesSummary.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-lg text-muted-foreground">No active tables</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tablesSummary.map((table) => (
                <Card key={table.table_id} className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">{table.table_name}</h3>
                      {table.has_ready && (
                        <Badge className="bg-green-500">
                          <Package className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">{table.open_orders_count} open order(s)</p>
                      <p className="text-muted-foreground">Oldest: {table.oldest_order_age}m ago</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
