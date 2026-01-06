"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ban, CheckCircle, Key } from "lucide-react"
import { toggleUserStatusAction } from "@/lib/superadmin/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { CreateUserDialog } from "./create-user-dialog"

interface Member {
  user_id: string
  role: string
  is_active: boolean
  users: {
    id: string
    email: string
    full_name?: string
    is_disabled?: boolean
    last_login_at?: string
  }
}

export function TenantUsers({ tenantId, initialMembers }: { tenantId: string; initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers)
  const { toast } = useToast()
  const router = useRouter()

  const handleToggleDisabled = async (member: Member) => {
    const newDisabled = !member.users.is_disabled

    const result = await toggleUserStatusAction(member.users.id, newDisabled, tenantId)

    if (result.error) {
      toast({ title: "Failed to update user", variant: "destructive" })
      return
    }

    setMembers(
      members.map((m) =>
        m.users.id === member.users.id ? { ...m, users: { ...m.users, is_disabled: newDisabled } } : m,
      ),
    )

    toast({ title: newDisabled ? "User disabled" : "User enabled" })
    router.refresh()
  }

  const handleResetPassword = async (member: Member) => {
    toast({
      title: "Password Reset",
      description: "Functionality requires user to use 'Forgot Password' on login page",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tenant Users</CardTitle>
        <CreateUserDialog tenantId={tenantId} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.user_id}>
                  <TableCell>{member.users.full_name || "-"}</TableCell>
                  <TableCell>{member.users.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.users.is_disabled ? "destructive" : member.is_active ? "default" : "secondary"}
                    >
                      {member.users.is_disabled ? "Disabled" : member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.users.last_login_at ? new Date(member.users.last_login_at).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleDisabled(member)}
                        title={member.users.is_disabled ? "Enable user" : "Disable user"}
                      >
                        {member.users.is_disabled ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(member)}
                        title="Reset password"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
