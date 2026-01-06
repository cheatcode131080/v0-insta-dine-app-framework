import type { SupabaseClient } from "@supabase/supabase-js"
import type { MenuItem } from "@/lib/types/database"

export async function listItems(
  supabase: SupabaseClient,
  tenantId: string,
  filters?: {
    categoryId?: string
    subcategoryId?: string
    search?: string
  },
) {
  console.log("[v0] listItems called with:", { tenantId, filters })

  let query = supabase.from("menu_items").select("*").eq("tenant_id", tenantId)

  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId)
  }

  if (filters?.subcategoryId) {
    query = query.eq("subcategory_id", filters.subcategoryId)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order("sort_order", { ascending: true })

  console.log("[v0] Query result:", { data: data?.length, error })

  if (error) throw error
  return data as MenuItem[]
}

export async function getItem(supabase: SupabaseClient, tenantId: string, itemId: string) {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", itemId)
    .eq("tenant_id", tenantId)
    .single()

  if (error) throw error
  return data as MenuItem
}

export async function createItem(
  supabase: SupabaseClient,
  tenantId: string,
  item: Omit<MenuItem, "id" | "tenant_id" | "created_at" | "updated_at">,
) {
  console.log("[v0] Creating item:", { tenantId, item })

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      tenant_id: tenantId,
      ...item,
    })
    .select()
    .single()

  console.log("[v0] Create result:", { data, error })

  if (error) throw error
  return data as MenuItem
}

export async function updateItem(
  supabase: SupabaseClient,
  tenantId: string,
  itemId: string,
  updates: Partial<Omit<MenuItem, "id" | "tenant_id" | "created_at" | "updated_at">>,
) {
  const { data, error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", itemId)
    .eq("tenant_id", tenantId)
    .select()
    .single()

  if (error) throw error
  return data as MenuItem
}

export async function deleteItem(supabase: SupabaseClient, tenantId: string, itemId: string) {
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId).eq("tenant_id", tenantId)

  if (error) throw error
}

export async function reorderItems(
  supabase: SupabaseClient,
  tenantId: string,
  items: { id: string; sort_order: number }[],
) {
  const updates = items.map((item) =>
    supabase.from("menu_items").update({ sort_order: item.sort_order }).eq("id", item.id).eq("tenant_id", tenantId),
  )

  await Promise.all(updates)
}

export async function uploadItemImage(supabase: SupabaseClient, tenantId: string, itemId: string, file: File) {
  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `tenant/${tenantId}/items/${itemId}/${fileName}`

  const { error: uploadError } = await supabase.storage.from("menu-images").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  })

  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from("menu-images").getPublicUrl(filePath)

  return publicUrl
}

export async function deleteItemImage(supabase: SupabaseClient, imageUrl: string) {
  // Extract path from public URL
  const url = new URL(imageUrl)
  const pathMatch = url.pathname.match(/menu-images\/(.+)$/)
  if (!pathMatch) return

  const filePath = pathMatch[1]
  const { error } = await supabase.storage.from("menu-images").remove([filePath])

  if (error) throw error
}
