"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { UserPlus, Users, Trash2, Mail } from "lucide-react"

// Temporary mock data
const MOCK_FAMILY_MEMBERS = [
  {
    id: "1",
    name: "Sarah Smith",
    email: "sarah@example.com",
    relationship: "Spouse",
    permissions: {
      bookServices: true,
      useWallet: true,
      viewHistory: true,
      manageBookings: false
    },
    addedOn: "2024-02-15"
  },
  // Add more family members...
]

interface Permission {
  id: string
  label: string
  description: string
}

const PERMISSIONS: Permission[] = [
  {
    id: "bookServices",
    label: "Book Services",
    description: "Can book new services using the family account"
  },
  {
    id: "useWallet",
    label: "Use Wallet",
    description: "Can use the family wallet for payments"
  },
  {
    id: "viewHistory",
    label: "View History",
    description: "Can view booking history and transactions"
  },
  {
    id: "manageBookings",
    label: "Manage Bookings",
    description: "Can modify or cancel existing bookings"
  }
]

export default function FamilyPage() {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberRelationship, setNewMemberRelationship] = useState("")
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [isEditPermissionsOpen, setIsEditPermissionsOpen] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})

  const handleAddMember = () => {
    // Handle adding new member logic
    console.log("Adding new member:", { newMemberEmail, newMemberName, newMemberRelationship })
    setIsAddMemberOpen(false)
    setNewMemberEmail("")
    setNewMemberName("")
    setNewMemberRelationship("")
  }

  const handleRemoveMember = (memberId: string) => {
    // Handle remove member logic
    console.log("Removing member:", memberId)
  }

  const handleEditPermissions = (member: any) => {
    setSelectedMember(member)
    setPermissions(member.permissions)
    setIsEditPermissionsOpen(true)
  }

  const handleSavePermissions = () => {
    // Handle save permissions logic
    console.log("Saving permissions for:", selectedMember?.id, permissions)
    setIsEditPermissionsOpen(false)
  }

  const handleResendInvite = (email: string) => {
    // Handle resend invite logic
    console.log("Resending invite to:", email)
  }

  return (
    <div className="container py-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Family Members</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage access and permissions for family members
              </p>
            </div>
            <Button onClick={() => setIsAddMemberOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_FAMILY_MEMBERS.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Added on {member.addedOn}
                      </p>
                      <p className="text-sm">Relationship: {member.relationship}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPermissions(member)}
                      >
                        Permissions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvite(member.email)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Family Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Enter member's name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter member's email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Relationship</label>
              <Input
                placeholder="e.g., Spouse, Child, Parent"
                value={newMemberRelationship}
                onChange={(e) => setNewMemberRelationship(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleAddMember}>
              Send Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditPermissionsOpen} onOpenChange={setIsEditPermissionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMember && (
              <div className="space-y-1">
                <h3 className="font-medium">{selectedMember.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
              </div>
            )}
            <div className="space-y-4">
              {PERMISSIONS.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">{permission.label}</label>
                    <p className="text-sm text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                  <Switch
                    checked={permissions[permission.id]}
                    onCheckedChange={(checked) =>
                      setPermissions((prev) => ({ ...prev, [permission.id]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={handleSavePermissions}>
              Save Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 