"use client"

import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useTenant } from "@/lib/hooks/use-tenant"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { getMenuPreview, type MenuPreviewData } from "@/lib/menu/preview"
import { CategoryNavigation } from "@/components/menu/category-navigation"
import { MenuItemCard } from "@/components/menu/menu-item-card"
import { MenuItemModal } from "@/components/menu/menu-item-modal"
import type { MenuItem } from "@/lib/types/database"

export default function MenuPreviewPage() {
  const router = useRouter()
  const { tenant, membership, isLoading: tenantLoading } = useTenant()
  const [menuData, setMenuData] = useState<MenuPreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const supabase = createBrowserClient()

  // Check admin access
  const isAdmin = membership && ["owner", "admin", "manager"].includes(membership.role)

  useEffect(() => {
    if (!tenantLoading && !isAdmin) {
      router.push("/dashboard/menu")
    }
  }, [tenantLoading, isAdmin, router])

  useEffect(() => {
    if (!tenant) return

    async function fetchMenuData() {
      try {
        setIsLoading(true)
        const data = await getMenuPreview(supabase, tenant.id)
        setMenuData(data)

        // Set first category as active
        if (data.categories.length > 0) {
          setActiveCategory(data.categories[0].id)
        }
      } catch (err) {
        console.error("[v0] Error fetching menu preview:", err)
        setError("Failed to load menu preview")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenuData()
  }, [tenant])

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
    const element = categoryRefs.current[categoryId]
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  if (tenantLoading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  if (!menuData || menuData.categories.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No categories yet. Add categories and items to preview your menu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu Master
          </Button>
        </div>
      </div>

      {/* Mobile Preview Container */}
      <div className="flex justify-center">
        <div className="w-full max-w-md bg-background rounded-lg border shadow-lg">
          {/* Preview Header */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="p-6 text-center">
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">Menu Preview</p>
            </div>

            {/* Category Navigation */}
            <div className="px-4 pb-4">
              <CategoryNavigation
                categories={menuData.categories.map((cat) => ({
                  id: cat.id,
                  name: cat.name,
                }))}
                activeCategory={activeCategory}
                onCategoryClick={handleCategoryClick}
              />
            </div>
          </div>

          {/* Menu Content */}
          <div className="p-4 space-y-8 pb-8">
            {menuData.categories.map((category) => (
              <div
                key={category.id}
                ref={(el) => {
                  categoryRefs.current[category.id] = el
                }}
              >
                {/* Category Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold">{category.name}</h2>
                  {category.description && <p className="text-sm text-muted-foreground mt-1">{category.description}</p>}
                </div>

                {/* Subcategories */}
                {category.subcategories.map((subcategory) => (
                  <div key={subcategory.id} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{subcategory.name}</h3>
                    <div className="space-y-3">
                      {subcategory.items.length > 0 ? (
                        subcategory.items.map((item) => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            onClick={() => handleItemClick(item)}
                            showAdminIndicators={true}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground py-4 text-center">No items in this subcategory</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Direct Category Items (no subcategory) */}
                {category.items.length > 0 && (
                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onClick={() => handleItemClick(item)}
                        showAdminIndicators={true}
                      />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {category.subcategories.length === 0 && category.items.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No items in this category</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Item Preview Modal */}
      <MenuItemModal item={selectedItem} open={isModalOpen} onOpenChange={setIsModalOpen} isPreviewMode={true} />
    </div>
  )
}
