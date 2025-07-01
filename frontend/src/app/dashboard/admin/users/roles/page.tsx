"use client"

import { useState, useEffect } from "react"
import { DataGrid } from "@/components/ui/data-grid"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Shield,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"

interface Permission {
  id: string
  name: string
  description: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  created_at: string
}

const DEFAULT_PERMISSIONS = [
  { id: "users_read", name: "Read Users", description: "Can view user details" },
  { id: "users_write", name: "Write Users", description: "Can create and edit users" },
  { id: "users_delete", name: "Delete Users", description: "Can delete users" },
  { id: "services_read", name: "Read Services", description: "Can view services" },
  { id: "services_write", name: "Write Services", description: "Can create and edit services" },
  { id: "services_delete", name: "Delete Services", description: "Can delete services" },
  { id: "bookings_read", name: "Read Bookings", description: "Can view bookings" },
  { id: "bookings_write", name: "Write Bookings", description: "Can create and edit bookings" },
  { id: "bookings_delete", name: "Delete Bookings", description: "Can delete bookings" },
  { id: "settings_read", name: "Read Settings", description: "Can view settings" },
  { id: "settings_write", name: "Write Settings", description: "Can modify settings" },
]

export default function RolesPage() {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setRoles(data)
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async () => {
    try {
      const { error } = await supabase
        .from("roles")
        .insert([
          {
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions,
          },
        ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Role created successfully",
      })

      fetchRoles()
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error creating role:", error)
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      const { error } = await supabase
        .from("roles")
        .update({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        })
        .eq("id", selectedRole.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Role updated successfully",
      })

      fetchRoles()
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = async () => {
    if (!selectedRole) return

    try {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", selectedRole.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Role deleted successfully",
      })

      fetchRoles()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting role:", error)
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      })
    }
  }

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }: { row: { original: Role } }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          {row.original.name}
        </div>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Permissions",
      accessorKey: "permissions",
      cell: ({ row }: { row: { original: Role } }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.permissions.map((permission: string) => (
            <Badge key={permission} variant="outline" className="text-xs">
              {permission}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Actions",
      cell: ({ row }: { row: { original: Role } }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedRole(row.original)
              setFormData({
                name: row.original.name,
                description: row.original.description,
                permissions: row.original.permissions,
              })
              setIsEditDialogOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedRole(row.original)
              setIsDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Role Management</h2>
        <Button onClick={() => {
          setSelectedRole(null)
          setFormData({
            name: "",
            description: "",
            permissions: [],
          })
          setIsEditDialogOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={roles}
      />

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Content Manager"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Can manage content and assets"
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {DEFAULT_PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          permissions: checked
                            ? [...formData.permissions, permission.id]
                            : formData.permissions.filter((p) => p !== permission.id),
                        })
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={permission.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={selectedRole ? handleUpdateRole : handleCreateRole}
            >
              {selectedRole ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this role? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 