"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, FileText, LayoutDashboard, LogOut, User } from "lucide-react"
import Link from "next/link"

interface SuperAdminShellProps {
  userEmail: string
  children: React.ReactNode
}

export function SuperAdminShell({ userEmail, children }: SuperAdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navItems = [
    { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/superadmin/tenants", label: "Tenants", icon: Building2 },
    { href: "/superadmin/audit", label: "Audit Logs", icon: FileText },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">InstaDine Super Admin</h1>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {userEmail}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30 p-6">{children}</main>
    </div>
  )
}
