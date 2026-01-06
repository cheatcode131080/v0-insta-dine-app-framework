"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ImageIcon } from "lucide-react"
import type { MenuItem } from "@/lib/types/database"

interface MenuItemCardProps {
  item: MenuItem
  onClick?: () => void
  showAdminIndicators?: boolean
}

export function MenuItemCard({ item, onClick, showAdminIndicators = false }: MenuItemCardProps) {
  const hasImage = !!item.image_url
  const hasDescription = !!item.description && item.description.trim().length > 0

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer" onClick={onClick}>
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative flex-shrink-0 w-24 h-24 bg-muted rounded-md overflow-hidden">
          {hasImage ? (
            <img src={item.image_url || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          {showAdminIndicators && !hasImage && (
            <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
              No image
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight">{item.title}</h3>
            {item.is_featured && (
              <Badge variant="default" className="flex-shrink-0 text-xs">
                Featured
              </Badge>
            )}
          </div>

          {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}

          {showAdminIndicators && !hasDescription && (
            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
              <AlertCircle className="w-3 h-3" />
              <span>No description</span>
            </div>
          )}

          {item.dietary_flags && item.dietary_flags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {item.dietary_flags.map((flag) => (
                <Badge key={flag} variant="outline" className="text-xs">
                  {flag}
                </Badge>
              ))}
            </div>
          )}

          {/* Placeholder for price */}
          <div className="mt-2 h-5" />
        </div>
      </div>
    </Card>
  )
}
