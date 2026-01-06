"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreVertical } from "lucide-react"
import { updateStaffMember, removeStaffMember } from "@/lib/staff/invitations"
import { useToast } from "@/hooks/use-toast"

interface StaffMemberCardProps {
  member: any
  currentUserRole: string
  onUpdate: () => void
}

export function StaffMemberCard({ member, currentUserRole, onUpdate }: StaffMemberCardProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const canEdit = ["owner", "admin"].includes(currentUserRole)
  const cannotRemoveSelf = member.user_id === member.current_user_id

  const handleRoleChange = async (newRole: string) => {
    setLoading(true)
    try {
      await updateStaffMember(member.id, { role: newRole })
      toast({ title: "Success", description: "Role updated successfully" })
      window.location.reload()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    setLoading(true)
    try {
      await updateStaffMember(member.id, { is_active: !member.is_active })
      toast({
        title: "Success",
        description: member.is_active ? "Staff member deactivated" : "Staff member activated",
      })
      window.location.reload()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this staff member?")) return

    setLoading(true)
    try {
      await removeStaffMember(member.id)
      toast({ title: "Success", description: "Staff member removed" })
      window.location.reload()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={member.users?.avatar_url || "/placeholder.svg"} />
          <AvatarFallback>
            {member.users?.full_name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase() || member.users?.email?.[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{member.users?.full_name || "Unnamed User"}</p>
          <p className="text-sm text-muted-foreground">{member.users?.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {canEdit ? (
          <Select value={member.role} onValueChange={handleRoleChange} disabled={loading}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="waiter">Waiter</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="default" className="capitalize">
            {member.role}
          </Badge>
        )}
        <Badge variant={member.is_active ? "default" : "secondary"}>{member.is_active ? "Active" : "Inactive"}</Badge>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={loading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleStatus}>
                {member.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleRemove} className="text-destructive" disabled={cannotRemoveSelf}>
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
