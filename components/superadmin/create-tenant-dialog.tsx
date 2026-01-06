"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createTenantWithOwnerAction } from "@/lib/superadmin/actions"
import { useToast } from "@/hooks/use-toast"

export function CreateTenantDialog({ onTenantCreated }: { onTenantCreated: (tenant: any) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [ownerPassword, setOwnerPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createTenantWithOwnerAction({
        name,
        slug,
        ownerName,
        ownerEmail,
        ownerPassword,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      onTenantCreated(result.data)
      toast({
        title: "Tenant created successfully",
        description: `Owner account created for ${ownerEmail}`,
      })
      setOpen(false)
      setName("")
      setSlug("")
      setOwnerName("")
      setOwnerEmail("")
      setOwnerPassword("")
    } catch (err: any) {
      toast({ title: "Failed to create tenant", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
          <DialogDescription>Add a new restaurant tenant and create their owner account</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-medium text-sm">Tenant Information</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Tenant Name</Label>
              <Input
                id="name"
                placeholder="e.g., 3 Elixir Restaurant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Company Code</Label>
              <Input
                id="slug"
                placeholder="e.g., 3ELIXIR"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toUpperCase())}
                className="uppercase"
                required
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for the tenant (letters and numbers only)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm">Owner Account</h3>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Full Name</Label>
              <Input
                id="ownerName"
                placeholder="e.g., John Doe"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Owner Email</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="e.g., owner@restaurant.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPassword">Owner Password</Label>
              <Input
                id="ownerPassword"
                type="password"
                placeholder="Minimum 6 characters"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                minLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">Owner will use this to login and manage their restaurants</p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Tenant & Owner..." : "Create Tenant & Owner"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
