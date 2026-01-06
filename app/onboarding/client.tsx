"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createTenant } from "@/lib/tenants/management"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function OnboardingClient() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSupportMode, setIsSupportMode] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const supportMode = localStorage.getItem("superadmin_support_mode") === "true"
    setIsSupportMode(supportMode)
  }, [])

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate slug from name
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    setSlug(generatedSlug)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSupportMode) {
      toast({
        title: "Error",
        description: "Cannot create new tenant in support mode. Exit support mode first.",
        variant: "destructive",
      })
      return
    }

    if (!name.trim() || !slug.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await createTenant(name, slug)
      toast({
        title: "Success",
        description: "Your restaurant has been created!",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create restaurant",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {isSupportMode ? "Support Mode Active" : "Welcome to InstaDine!"}
          </CardTitle>
          <CardDescription>
            {isSupportMode
              ? "You are in support mode. Please exit to create new tenants."
              : "Let's set up your first restaurant"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSupportMode && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cannot create tenant while in support mode. Return to superadmin panel to exit support mode.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                placeholder="e.g., Bella Italia"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={isLoading || isSupportMode}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                placeholder="e.g., bella-italia"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={isLoading || isSupportMode}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be used in your QR code URLs: /t/<span className="font-medium">{slug || "your-slug"}</span>
                /table-id
              </p>
            </div>
            <div className="flex gap-2">
              {isSupportMode && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => router.push("/superadmin")}
                >
                  Return to Superadmin
                </Button>
              )}
              <Button
                type="submit"
                className={isSupportMode ? "flex-1" : "w-full"}
                disabled={isLoading || isSupportMode}
              >
                {isLoading ? "Creating..." : "Create Restaurant & Continue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
