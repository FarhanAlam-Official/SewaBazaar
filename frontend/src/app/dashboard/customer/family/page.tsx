"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Users, Trash2, Mail, Calendar, Shield, CheckCircle, XCircle, Send } from "lucide-react"

// Enhanced mock data with more family members
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
    addedOn: "2024-02-15",
    status: "active"
  },
  {
    id: "2",
    name: "Tom Smith",
    email: "tom@example.com",
    relationship: "Child",
    permissions: {
      bookServices: false,
      useWallet: false,
      viewHistory: true,
      manageBookings: false
    },
    addedOn: "2024-03-10",
    status: "pending"
  },
  {
    id: "3",
    name: "Emily Johnson",
    email: "emily@example.com",
    relationship: "Parent",
    permissions: {
      bookServices: true,
      useWallet: true,
      viewHistory: true,
      manageBookings: true
    },
    addedOn: "2024-01-22",
    status: "active"
  },
  {
    id: "4",
    name: "Michael Brown",
    email: "michael@example.com",
    relationship: "Sibling",
    permissions: {
      bookServices: true,
      useWallet: false,
      viewHistory: false,
      manageBookings: false
    },
    addedOn: "2024-03-05",
    status: "active"
  }
]

interface Permission {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const PERMISSIONS: Permission[] = [
  {
    id: "bookServices",
    label: "Book Services",
    description: "Can book new services using the family account",
    icon: UserPlus
  },
  {
    id: "useWallet",
    label: "Use Wallet",
    description: "Can use the family wallet for payments",
    icon: Shield
  },
  {
    id: "viewHistory",
    label: "View History",
    description: "Can view booking history and transactions",
    icon: Calendar
  },
  {
    id: "manageBookings",
    label: "Manage Bookings",
    description: "Can modify or cancel existing bookings",
    icon: Users
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors shadow-sm">
              <CheckCircle className="h-3 w-3 mr-1" /> Active
            </Badge>
          </motion.div>
        )
      case "pending":
        return (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors shadow-sm">
              <Mail className="h-3 w-3 mr-1" /> Pending
            </Badge>
          </motion.div>
        )
      default:
        return (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Badge variant="outline" className="hover:bg-muted/50 transition-colors shadow-sm">
              {status}
            </Badge>
          </motion.div>
        )
    }
  }

  return (
    <div className="container py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-6 border border-border shadow-lg bg-background/50 backdrop-blur-sm rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <motion.h1 
                  className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Family Members
                </motion.h1>
                <motion.p 
                  className="text-sm text-muted-foreground mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Manage access and permissions for family members
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  onClick={() => setIsAddMemberOpen(true)} 
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg px-4 py-2 font-medium"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </motion.div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {MOCK_FAMILY_MEMBERS.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="cursor-pointer"
                  >
                    <Card className="transition-all duration-300 hover:shadow-xl hover:border-primary/50 border border-border overflow-hidden bg-background/50 backdrop-blur-sm rounded-xl">
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} />
                                <AvatarFallback className="bg-muted">
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <motion.h3 
                                  className="font-semibold text-foreground text-lg"
                                  whileHover={{ x: 2 }}
                                >
                                  {member.name}
                                </motion.h3>
                                {getStatusBadge(member.status)}
                              </div>
                              <motion.p 
                                className="text-sm text-muted-foreground flex items-center gap-1"
                                whileHover={{ x: 2 }}
                              >
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </motion.p>
                              <div className="flex flex-wrap items-center gap-2">
                                <motion.p 
                                  className="text-sm text-muted-foreground flex items-center gap-1"
                                  whileHover={{ x: 2 }}
                                >
                                  <Calendar className="h-3 w-3" />
                                  Added on {member.addedOn}
                                </motion.p>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Badge variant="outline" className="text-xs hover:bg-primary/20 transition-all duration-300 border-primary/40 text-primary dark:text-white dark:hover:text-white">
                                    {member.relationship}
                                  </Badge>
                                </motion.div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPermissions(member);
                                }}
                                className="transition-all duration-300 border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary hover:text-primary dark:hover:bg-primary/30 dark:hover:text-white dark:hover:border-primary rounded-lg"
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Permissions</span>
                              </Button>
                            </motion.div>
                            {member.status === "pending" && (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResendInvite(member.email);
                                  }}
                                className="transition-all duration-300 border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary hover:text-primary dark:hover:bg-primary/30 dark:hover:text-white dark:hover:border-primary rounded-lg"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Resend</span>
                                </Button>
                              </motion.div>
                            )}
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMember(member.id);
                                }}
                                className="transition-all duration-300 border border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive dark:hover:bg-destructive/30 dark:hover:text-white dark:hover:border-destructive rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                        
                        {/* Permissions Summary */}
                        <motion.div 
                          className="mt-4 pt-4 border-t border-border"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <p className="text-xs font-medium text-muted-foreground mb-2">PERMISSIONS</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(member.permissions).map(([key, value]) => {
                              if (!value) return null;
                              const permission = PERMISSIONS.find(p => p.id === key);
                              return permission ? (
                                <motion.div
                                  key={key}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Badge 
                                    variant="outline"
                                    className="text-xs py-1 px-2 hover:bg-primary/10 transition-all duration-300 border border-primary/40 text-primary dark:text-white dark:hover:text-white shadow-sm hover:shadow-md"
                                  >
                                    {permission.label}
                                  </Badge>
                                </motion.div>
                              ) : null;
                            })}
                            {Object.values(member.permissions).every(v => !v) && (
                              <Badge variant="outline" className="text-xs py-1 px-2 border border-muted-foreground/30 text-muted-foreground dark:text-white dark:border-white/30">
                                No permissions
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background/90 backdrop-blur-xl border-border rounded-xl shadow-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground text-xl">
                <UserPlus className="h-5 w-5 text-primary" />
                Add Family Member
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input
                  placeholder="Enter member's name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="rounded-lg border-border"
                />
              </motion.div>
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="Enter member's email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="rounded-lg border-border"
                />
              </motion.div>
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="text-sm font-medium text-foreground">Relationship</label>
                <Input
                  placeholder="e.g., Spouse, Child, Parent"
                  value={newMemberRelationship}
                  onChange={(e) => setNewMemberRelationship(e.target.value)}
                  className="rounded-lg border-border"
                />
              </motion.div>
            </div>
            <DialogFooter className="gap-2">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="outline" onClick={() => setIsAddMemberOpen(false)} className="rounded-lg">
                  Cancel
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button onClick={handleAddMember} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-lg">
                  Send Invite
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditPermissionsOpen} onOpenChange={setIsEditPermissionsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background/90 backdrop-blur-xl border-border rounded-xl shadow-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground text-xl">
                <Shield className="h-5 w-5 text-primary" />
                Edit Permissions
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedMember && (
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name)}&background=random`} />
                    <AvatarFallback>{selectedMember.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-foreground">{selectedMember.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                  </div>
                </motion.div>
              )}
              <div className="space-y-3">
                {PERMISSIONS.map((permission, index) => {
                  const Icon = permission.icon;
                  return (
                    <motion.div 
                      key={permission.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-all duration-300 bg-background/50 backdrop-blur-sm hover:shadow-md"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-foreground">{permission.label}</label>
                          <p className="text-xs text-muted-foreground dark:text-gray-300">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Switch
                          checked={permissions[permission.id]}
                          onCheckedChange={(checked) =>
                            setPermissions((prev) => ({ ...prev, [permission.id]: checked }))
                          }
                          className="data-[state=checked]:bg-primary transition-colors"
                        />
                      </motion.div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="outline" onClick={() => setIsEditPermissionsOpen(false)} className="rounded-lg">
                  Cancel
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button onClick={handleSavePermissions} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-lg">
                  Save Permissions
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
