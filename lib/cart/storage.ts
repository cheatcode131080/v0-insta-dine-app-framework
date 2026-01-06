import type { CartItem } from "@/lib/types/database"

function getCartKey(companyCode: string, tableId: string): string {
  return `instadine_cart_${companyCode}_${tableId}`
}

export function getCart(companyCode: string, tableId: string): CartItem[] {
  if (typeof window === "undefined") return []

  try {
    const key = getCartKey(companyCode, tableId)
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("[v0] Error reading cart:", error)
    return []
  }
}

export function setCart(companyCode: string, tableId: string, items: CartItem[]): void {
  if (typeof window === "undefined") return

  try {
    const key = getCartKey(companyCode, tableId)
    localStorage.setItem(key, JSON.stringify(items))
  } catch (error) {
    console.error("[v0] Error saving cart:", error)
  }
}

export function addItem(companyCode: string, tableId: string, item: Omit<CartItem, "added_at">): void {
  const cart = getCart(companyCode, tableId)

  // Check if item already exists
  const existingIndex = cart.findIndex((i) => i.item_id === item.item_id && i.notes === item.notes)

  if (existingIndex >= 0) {
    // Update quantity
    cart[existingIndex].qty += item.qty
  } else {
    // Add new item
    cart.push({
      ...item,
      added_at: new Date().toISOString(),
    })
  }

  setCart(companyCode, tableId, cart)
}

export function updateQty(companyCode: string, tableId: string, itemId: string, addedAt: string, qty: number): void {
  const cart = getCart(companyCode, tableId)
  const index = cart.findIndex((i) => i.item_id === itemId && i.added_at === addedAt)

  if (index >= 0 && qty > 0) {
    cart[index].qty = qty
    setCart(companyCode, tableId, cart)
  }
}

export function updateNotes(
  companyCode: string,
  tableId: string,
  itemId: string,
  addedAt: string,
  notes: string,
): void {
  const cart = getCart(companyCode, tableId)
  const index = cart.findIndex((i) => i.item_id === itemId && i.added_at === addedAt)

  if (index >= 0) {
    cart[index].notes = notes
    setCart(companyCode, tableId, cart)
  }
}

export function removeItem(companyCode: string, tableId: string, itemId: string, addedAt: string): void {
  const cart = getCart(companyCode, tableId)
  const filtered = cart.filter((i) => !(i.item_id === itemId && i.added_at === addedAt))
  setCart(companyCode, tableId, filtered)
}

export function clearCart(companyCode: string, tableId: string): void {
  setCart(companyCode, tableId, [])
}

export function getItemCount(companyCode: string, tableId: string): number {
  const cart = getCart(companyCode, tableId)
  return cart.reduce((sum, item) => sum + item.qty, 0)
}
