import type { SupabaseClient } from "@supabase/supabase-js"
import type { MenuCategory, MenuSubcategory, MenuItem } from "@/lib/types/database"

export interface MenuPreviewData {
  categories: (MenuCategory & {
    subcategories: (MenuSubcategory & {
      items: MenuItem[]
    })[]
    items: MenuItem[]
  })[]
}

export async function getMenuPreview(supabase: SupabaseClient, tenantId: string): Promise<MenuPreviewData> {
  // Fetch categories
  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })

  if (catError) throw catError

  // Fetch subcategories
  const { data: subcategories, error: subError } = await supabase
    .from("menu_subcategories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })

  if (subError) throw subError

  // Fetch active items
  const { data: items, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_available", true)
    .order("sort_order", { ascending: true })

  if (itemsError) throw itemsError

  // Group data
  const categoriesWithData = categories.map((category) => {
    const categorySubcategories = subcategories.filter((sub) => sub.category_id === category.id)

    const subcategoriesWithItems = categorySubcategories.map((subcategory) => ({
      ...subcategory,
      items: items.filter((item) => item.subcategory_id === subcategory.id),
    }))

    const categoryItems = items.filter((item) => item.category_id === category.id && !item.subcategory_id)

    return {
      ...category,
      subcategories: subcategoriesWithItems,
      items: categoryItems,
    }
  })

  return { categories: categoriesWithData }
}
