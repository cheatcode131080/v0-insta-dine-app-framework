"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Tenant, TenantMember } from "@/lib/types/database"
import { getRolePermissions, type RolePermissions } from "@/lib/permissions/roles"

interface TenantContextType {
  tenant: Tenant | null
  tenants: Tenant[]
  membership: TenantMember | null
  permissions: RolePermissions | null
  isLoading: boolean
  switchTenant: (tenantId: string) => void
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({
  children,
  initialTenantId,
}: {
  children: React.ReactNode
  initialTenantId?: string
}) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [membership, setMembership] = useState<TenantMember | null>(null)
  const [permissions, setPermissions] = useState<RolePermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadTenants()
  }, [])

  useEffect(() => {
    if (membership?.role) {
      setPermissions(getRolePermissions(membership.role))
    } else {
      setPermissions(null)
    }
  }, [membership])

  async function loadTenants() {
    try {
      let user
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          console.error("[v0] Error getting user:", error)
          setIsLoading(false)
          return
        }
        user = data.user
      } catch (err) {
        console.error("[v0] Failed to fetch user, this might be a network or CORS issue:", err)
        setIsLoading(false)
        return
      }

      if (!user) {
        console.log("[v0] No authenticated user found")
        setIsLoading(false)
        return
      }

      // Get user's tenants
      const { data: memberships, error: membershipsError } = await supabase
        .from("tenant_members")
        .select("*, tenants(*)")
        .eq("user_id", user.id)
        .eq("is_active", true)

      if (membershipsError) {
        console.error("[v0] Error loading memberships:", membershipsError)
        setIsLoading(false)
        return
      }

      if (memberships && memberships.length > 0) {
        const tenantsList = memberships.map((m: any) => m.tenants)
        setTenants(tenantsList)

        // Set active tenant
        const activeTenantId = initialTenantId || localStorage.getItem("active_tenant_id") || tenantsList[0].id

        const activeMembership = memberships.find((m: any) => m.tenant_id === activeTenantId)
        if (activeMembership) {
          setTenant(activeMembership.tenants)
          setMembership(activeMembership)
          localStorage.setItem("active_tenant_id", activeTenantId)
        }
      } else {
        console.log("[v0] No active tenant memberships found for user")
      }
    } catch (error) {
      console.error("[v0] Error loading tenants:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function switchTenant(tenantId: string) {
    const newTenant = tenants.find((t) => t.id === tenantId)
    if (newTenant) {
      setTenant(newTenant)
      localStorage.setItem("active_tenant_id", tenantId)
      window.location.reload()
    }
  }

  return (
    <TenantContext.Provider value={{ tenant, tenants, membership, permissions, isLoading, switchTenant }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider")
  }
  return context
}
