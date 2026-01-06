export type UserRole = "owner" | "admin" | "manager" | "staff" | "waiter" | "kitchen"

export interface RolePermissions {
  canViewDashboard: boolean
  canViewOrders: boolean
  canManageOrders: boolean
  canViewMenu: boolean
  canManageMenu: boolean
  canViewTables: boolean
  canManageTables: boolean
  canViewStaff: boolean
  canManageStaff: boolean
  canViewSettings: boolean
  canManageSettings: boolean
}

const rolePermissionsMap: Record<UserRole, RolePermissions> = {
  owner: {
    canViewDashboard: true,
    canViewOrders: true,
    canManageOrders: true,
    canViewMenu: true,
    canManageMenu: true,
    canViewTables: true,
    canManageTables: true,
    canViewStaff: true,
    canManageStaff: true,
    canViewSettings: true,
    canManageSettings: true,
  },
  admin: {
    canViewDashboard: true,
    canViewOrders: true,
    canManageOrders: true,
    canViewMenu: true,
    canManageMenu: true,
    canViewTables: true,
    canManageTables: true,
    canViewStaff: true,
    canManageStaff: true,
    canViewSettings: true,
    canManageSettings: true,
  },
  manager: {
    canViewDashboard: false,
    canViewOrders: true,
    canManageOrders: true,
    canViewMenu: true,
    canManageMenu: true,
    canViewTables: true,
    canManageTables: true,
    canViewStaff: true,
    canManageStaff: false,
    canViewSettings: false,
    canManageSettings: false,
  },
  staff: {
    canViewDashboard: false,
    canViewOrders: true,
    canManageOrders: true,
    canViewMenu: true,
    canManageMenu: false,
    canViewTables: false,
    canManageTables: false,
    canViewStaff: false,
    canManageStaff: false,
    canViewSettings: false,
    canManageSettings: false,
  },
  waiter: {
    canViewDashboard: false,
    canViewOrders: true,
    canManageOrders: true,
    canViewMenu: true,
    canManageMenu: false,
    canViewTables: false,
    canManageTables: false,
    canViewStaff: false,
    canManageStaff: false,
    canViewSettings: false,
    canManageSettings: false,
  },
  kitchen: {
    canViewDashboard: false,
    canViewOrders: true,
    canManageOrders: true,
    canViewMenu: false,
    canManageMenu: false,
    canViewTables: false,
    canManageTables: false,
    canViewStaff: false,
    canManageStaff: false,
    canViewSettings: false,
    canManageSettings: false,
  },
}

export function getRolePermissions(role: UserRole): RolePermissions {
  return rolePermissionsMap[role]
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const permissions = getRolePermissions(role)

  if (route.startsWith("/dashboard/orders")) return permissions.canViewOrders
  if (route.startsWith("/dashboard/menu")) return permissions.canViewMenu
  if (route.startsWith("/dashboard/tables")) return permissions.canViewTables
  if (route.startsWith("/dashboard/staff")) return permissions.canViewStaff
  if (route.startsWith("/dashboard/settings")) return permissions.canViewSettings
  if (route === "/dashboard") return permissions.canViewDashboard

  return false
}
