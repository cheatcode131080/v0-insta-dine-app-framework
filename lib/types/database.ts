export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url?: string
  subdomain?: string
  custom_domain?: string
  subscription_tier: "free" | "basic" | "premium" | "enterprise"
  subscription_status: "active" | "suspended" | "cancelled"
  status?: "active" | "suspended"
  support_notes?: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  phone?: string
  avatar_url?: string
  is_superadmin?: boolean
  is_disabled?: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface TenantMember {
  id: string
  tenant_id: string
  user_id: string
  role: "owner" | "admin" | "manager" | "staff" | "waiter" | "kitchen"
  is_active: boolean
  permissions: Record<string, any>
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  tenant_id: string
  name: string
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MenuSubcategory {
  id: string
  tenant_id: string
  category_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  tenant_id: string
  category_id?: string
  subcategory_id?: string
  title: string
  description?: string
  price: number
  image_url?: string
  is_available: boolean
  is_featured: boolean
  allergens?: string[]
  dietary_flags?: string[]
  preparation_time?: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Table {
  id: string
  tenant_id: string
  table_number: string
  capacity: number
  location?: string
  qr_code?: string
  status: "available" | "occupied" | "reserved" | "maintenance"
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  tenant_id: string
  table_id?: string
  customer_name?: string
  customer_phone?: string
  order_type: "dine_in" | "takeout" | "delivery"
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled"
  subtotal: number
  tax: number
  tip: number
  total: number
  notes?: string
  assigned_to?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id?: string
  menu_item_name: string
  menu_item_price: number
  quantity: number
  special_instructions?: string
  status: "pending" | "preparing" | "ready" | "served"
  created_at: string
  updated_at: string
}

export interface RestaurantTable {
  id: string
  tenant_id: string
  display_name: string
  created_at: string
}

export interface TableLayout {
  id: string
  tenant_id: string
  table_id: string
  x: number
  y: number
  radius: number
  created_at: string
}

export interface TableWithLayout extends RestaurantTable {
  layout?: TableLayout
}

export interface CartItem {
  item_id: string
  title: string
  qty: number
  notes: string
  image_url?: string
  added_at: string
}

export interface AuditLog {
  id: string
  actor_profile_id?: string
  actor_type: "superadmin" | "admin" | "user"
  tenant_id?: string
  action: string
  metadata: Record<string, any>
  created_at: string
}
