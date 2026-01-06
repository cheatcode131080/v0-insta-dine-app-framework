"use client"

import { useState, useEffect } from "react"
import { CustomerHeader } from "@/components/customer/customer-header"
import { CategoryNavigation } from "@/components/menu/category-navigation"
import { MenuItemCard } from "@/components/menu/menu-item-card"
import { CustomerItemModal } from "@/components/customer/customer-item-modal"
import { addItem, getItemCount } from "@/lib/cart/storage"
import { useToast } from "@/hooks/use-toast"
import type { MenuPreviewData } from "@/lib/menu/preview"
import type { MenuItem } from "@/lib/types/database"

interface CustomerMenuClientProps {
  companyCode: string
  tableId: string
  restaurantName: string
  tableName: string
  menuData: MenuPreviewData
}

export function CustomerMenuClient({
  companyCode,
  tableId,
  restaurantName,
  tableName,
  menuData,
}: CustomerMenuClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    menuData.categories.length > 0 ? menuData.categories[0].id : null,
  )
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const { toast } = useToast()

  // Update cart count on mount and when modal closes
  useEffect(() => {
    setCartCount(getItemCount(companyCode, tableId))
  }, [companyCode, tableId, modalOpen])

  const handleAddToCart = (qty: number, notes: string) => {
    if (!selectedItem) return

    addItem(companyCode, tableId, {
      item_id: selectedItem.id,
      title: selectedItem.title,
      qty,
      notes,
      image_url: selectedItem.image_url,
    })

    setModalOpen(false)
    setCartCount(getItemCount(companyCode, tableId))
    toast({
      title: "Added to cart",
      description: `${selectedItem.title} (${qty})`,
    })
  }

  const categoryList = menuData.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }))

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader
        restaurantName={restaurantName}
        tableName={tableName}
        companyCode={companyCode}
        tableId={tableId}
        cartCount={cartCount}
      />

      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Category Navigation */}
        <div className="sticky top-[72px] z-40 bg-background pt-2 -mx-4 px-4 pb-4 border-b">
          <CategoryNavigation
            categories={categoryList}
            activeCategory={activeCategory}
            onCategoryClick={setActiveCategory}
          />
        </div>

        {/* Menu Content */}
        <div className="space-y-8">
          {menuData.categories.map((category) => (
            <div key={category.id} id={`category-${category.id}`}>
              <h2 className="text-2xl font-bold mb-4">{category.name}</h2>

              {/* Category description */}
              {category.description && <p className="text-muted-foreground mb-4">{category.description}</p>}

              {/* Items directly under category */}
              {category.items.length > 0 && (
                <div className="space-y-3 mb-6">
                  {category.items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onClick={() => {
                        setSelectedItem(item)
                        setModalOpen(true)
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Subcategories */}
              {category.subcategories.map((subcategory) => (
                <div key={subcategory.id} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">{subcategory.name}</h3>
                  <div className="space-y-3">
                    {subcategory.items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onClick={() => {
                          setSelectedItem(item)
                          setModalOpen(true)
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Item Detail Modal */}
      <CustomerItemModal
        item={selectedItem}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAddToCart={handleAddToCart}
      />
    </div>
  )
}
