"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"

export function TenantBanner() {
  const [isSupportMode, setIsSupportMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supportMode = localStorage.getItem("superadmin_support_mode")
    setIsSupportMode(supportMode === "true")
  }, [])

  const handleExit = () => {
    localStorage.removeItem("superadmin_support_mode")
    localStorage.removeItem("active_tenant_id")
    router.push("/superadmin/tenants")
  }

  if (!isSupportMode) return null

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Support Mode Active - You are viewing this tenant as a superadmin</span>
      </div>
      <Button size="sm" variant="ghost" onClick={handleExit} className="gap-2 text-amber-950 hover:bg-amber-600">
        Exit Support Mode
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
