"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"

interface CustomerHeaderProps {
  restaurantName: string
  tableName: string
  companyCode: string
  tableId: string
  cartCount: number
}

export function CustomerHeader({ restaurantName, tableName, companyCode, tableId, cartCount }: CustomerHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-background border-b">
      <div className="container max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{restaurantName}</h1>
            <p className="text-sm text-muted-foreground">{tableName}</p>
          </div>
          <Link href={`/t/${companyCode}/${tableId}/cart`}>
            <Button variant="outline" size="sm" className="relative bg-transparent">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cartCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
