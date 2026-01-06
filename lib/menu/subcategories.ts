import type { SupabaseClient } from "@supabase/supabase-js"
import type { MenuSubcategory } from "@/lib/types/database"

export async function listSubcategories(supabase: SupabaseClient, tenantId: string, categoryId?: string) {
  let query = supabase.from("menu_subcategories").select("*").eq("tenant_id", tenantId)

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  const { data, error } = await query.order("sort_order", { ascending: true })

  if (error) throw error
  return data as MenuSubcategory[]
}

export async function createSubcategory(
  supabase: SupabaseClient,
  tenantId: string,
  subcategory: Omit<MenuSubcategory, "id" | "tenant_id" | "created_at">,
) {
  const { data, error } = await supabase
    .from("menu_subcategories")
    .insert({
      tenant_id: tenantId,
      ...subcategory,
    })
    .select()
    .single()

  if (error) throw error
  return data as MenuSubcategory
}

export async function updateSubcategory(
  supabase: SupabaseClient,
  tenantId: string,
  subcategoryId: string,
  updates: Partial<Omit<MenuSubcategory, "id" | "tenant_id" | "created_at">>,
) {
  const { data, error } = await supabase
    .from("menu_subcategories")
    .update(updates)
    .eq("id", subcategoryId)
    .eq("tenant_id", tenantId)
    .select()
    .single()

  if (error) throw error
  return data as MenuSubcategory
}

export async function deleteSubcategory(supabase: SupabaseClient, tenantId: string, subcategoryId: string) {
  const { error } = await supabase.from("menu_subcategories").delete().eq("id", subcategoryId).eq("tenant_id", tenantId)

  if (error) throw error
}

export async function reorderSubcategories(
  supabase: SupabaseClient,
  tenantId: string,
  subcategories: { id: string; sort_order: number }[],
) {
  const updates = subcategories.map((subcat) =>
    supabase
      .from("menu_subcategories")
      .update({ sort_order: subcat.sort_order })
      .eq("id", subcat.id)
      .eq("tenant_id", tenantId),
  )

  await Promise.all(updates)
}
