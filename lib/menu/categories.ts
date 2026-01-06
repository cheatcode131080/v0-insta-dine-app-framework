import type { SupabaseClient } from "@supabase/supabase-js"
import type { MenuCategory } from "@/lib/types/database"

export async function listCategories(supabase: SupabaseClient, tenantId: string) {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })

  if (error) throw error
  return data as MenuCategory[]
}

export async function createCategory(
  supabase: SupabaseClient,
  tenantId: string,
  category: Omit<MenuCategory, "id" | "tenant_id" | "created_at" | "updated_at">,
) {
  const { data, error } = await supabase
    .from("menu_categories")
    .insert({
      tenant_id: tenantId,
      ...category,
    })
    .select()
    .single()

  if (error) throw error
  return data as MenuCategory
}

export async function updateCategory(
  supabase: SupabaseClient,
  tenantId: string,
  categoryId: string,
  updates: Partial<Omit<MenuCategory, "id" | "tenant_id" | "created_at" | "updated_at">>,
) {
  const { data, error } = await supabase
    .from("menu_categories")
    .update(updates)
    .eq("id", categoryId)
    .eq("tenant_id", tenantId)
    .select()
    .single()

  if (error) throw error
  return data as MenuCategory
}

export async function deleteCategory(supabase: SupabaseClient, tenantId: string, categoryId: string) {
  const { error } = await supabase.from("menu_categories").delete().eq("id", categoryId).eq("tenant_id", tenantId)

  if (error) throw error
}

export async function reorderCategories(
  supabase: SupabaseClient,
  tenantId: string,
  categories: { id: string; sort_order: number }[],
) {
  const updates = categories.map((cat) =>
    supabase.from("menu_categories").update({ sort_order: cat.sort_order }).eq("id", cat.id).eq("tenant_id", tenantId),
  )

  await Promise.all(updates)
}
