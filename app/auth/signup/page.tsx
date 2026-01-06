"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Menu } from "lucide-react"

export default function SignupPage() {
  const [companyCode, setCompanyCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (companyCode) {
        const normalizedCode = companyCode.trim().toUpperCase()
        console.log("[v0] Validating company code:", normalizedCode)

        const { data: tenant, error: tenantError } = await supabase
          .from("tenants")
          .select("id, name")
          .eq("slug", normalizedCode)
          .single()

        console.log("[v0] Tenant lookup result:", { tenant, tenantError })

        if (tenantError || !tenant) {
          throw new Error("Invalid company code. Please check with your restaurant administrator.")
        }

        console.log("[v0] Valid tenant found:", tenant.name)
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            company_code: companyCode.trim().toUpperCase() || undefined,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        setSuccess(true)
      }
    } catch (err: any) {
      console.error("[v0] Signup error:", err)
      setError(err.message || "Failed to sign up")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md border-2 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg
                className="h-7 w-7 text-green-600 dark:text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base">
              We've sent you a confirmation link to verify your account and get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/auth/login")} className="h-11 w-full shadow-md">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>Get started with InstaDine today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyCode">Company Code (Optional)</Label>
                <Input
                  id="companyCode"
                  type="text"
                  placeholder="e.g., 3ELIXIR"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  className="h-11 uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  If you were invited by a restaurant, enter their company code. Leave blank to create your own
                  restaurant.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
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
                  minLength={6}
                  className="h-11"
                />
              </div>
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
                  {error}
                </div>
              )}
              <Button type="submit" className="h-11 w-full shadow-md" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {"Already have an account? "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
