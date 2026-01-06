"use client"

import type React from "react"
import { Menu } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
  const [companyCode, setCompanyCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("[v0] Starting login process...")
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (!data.user) throw new Error("Login failed")

      console.log("[v0] User authenticated, checking profile...")
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("is_superadmin, is_disabled")
        .eq("id", data.user.id)
        .single()

      console.log("[v0] Profile data:", profile)
      console.log("[v0] Profile error:", profileError)

      if (profile?.is_disabled) {
        await supabase.auth.signOut()
        throw new Error("Your account has been disabled. Please contact support.")
      }

      await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", data.user.id)

      if (profile?.is_superadmin) {
        console.log("[v0] User is superadmin, redirecting to /superadmin")
        router.push("/superadmin")
        return
      }

      console.log("[v0] User is not superadmin, validating company code...")
      if (!companyCode.trim()) {
        throw new Error("Company code is required for regular users.")
      }

      // Regular user flow: validate company code and tenant membership
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("slug", companyCode.trim().toUpperCase())
        .single()

      if (tenantError || !tenant) {
        throw new Error("Invalid company code. Please check with your restaurant administrator.")
      }

      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id, role, is_active")
        .eq("user_id", data.user.id)
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .maybeSingle()

      if (!membership) {
        throw new Error(
          `You don't have access to ${tenant.name}. Please check your company code or contact your administrator.`,
        )
      }

      localStorage.setItem("active_tenant_id", tenant.id)

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Menu className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">InstaDine</h1>
            <p className="text-sm text-muted-foreground">Restaurant Management Platform</p>
          </div>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyCode">
                  Company Code <span className="text-xs text-muted-foreground">(optional for superadmins)</span>
                </Label>
                <Input
                  id="companyCode"
                  type="text"
                  placeholder="e.g., 3ELIXIR (leave blank if superadmin)"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  className="h-11 uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Your restaurant's unique identifier provided by your administrator
                </p>
              </div>
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
                  {error}
                </div>
              )}
              <Button type="submit" className="h-11 w-full shadow-md" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
