"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ActivityTimeline } from "@/components/ui/activity-timeline"
import { showToast } from "@/components/ui/enhanced-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/contexts/AuthContext"
import Image from "next/image"
import {
  Camera,
  Mail,
  Phone,
  Shield,
  User,
  UserCircle,
  Bell,
  Palette,
  Calendar,
  Users,
  Settings,
  Key,
  Activity
} from "lucide-react"

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  profile_picture: string | null
  role: string
  created_at: string
  bio: string
  last_active: string
  department: string
  permissions: string[]
}

interface AdminStats {
  total_users: number
  active_providers: number
  pending_approvals: number
  system_health: number
}

export default function AdminProfilePage() {
  const { user, loading, refreshUser } = useAuth()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({
    id: "1",
    first_name: "Admin",
    last_name: "User",
    email: "admin@sewabazaar.com",
    phone: "+977 9876543210",
    profile_picture: null,
    role: "admin",
    created_at: "2024-01-01",
    bio: "Platform administrator responsible for system management and user support.",
    last_active: "2024-03-20T10:30:00Z",
    department: "System Administration",
    permissions: ["all"]
  })

  const [stats, setStats] = useState<AdminStats>({
    total_users: 1250,
    active_providers: 85,
    pending_approvals: 12,
    system_health: 98
  })

  const activities: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: "error" | "success" | "info" | "warning";
    icon: JSX.Element;
  }[] = [
    {
      id: "1",
      title: "System Update Deployed",
      description: "Successfully deployed v2.1.0 with new features",
      timestamp: "1 hour ago",
      type: "success",
      icon: <Settings className="h-4 w-4 text-white" />,
    },
    {
      id: "2",
      title: "User Verification",
      description: "Verified 5 new service providers",
      timestamp: "3 hours ago",
      type: "info",
      icon: <Users className="h-4 w-4 text-white" />,
    },
    {
      id: "3",
      title: "Security Alert",
      description: "Blocked suspicious login attempt",
      timestamp: "1 day ago",
      type: "warning",
      icon: <Shield className="h-4 w-4 text-white" />,
    },
    {
      id: "4",
      title: "API Key Generated",
      description: "Generated new API key for integration",
      timestamp: "2 days ago",
      type: "info",
      icon: <Key className="h-4 w-4 text-white" />,
    }
  ]

  useEffect(() => {
    if (user) {
      // Initialize profile data from user context
      setProfile(prev => ({
        ...prev,
        first_name: user.first_name || prev.first_name,
        last_name: user.last_name || prev.last_name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        profile_picture: user.profile_picture || prev.profile_picture
      }))
      if (user.profile_picture) {
        setImagePreview(user.profile_picture)
      }
    }
  }, [user])

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast.error({
          title: "Image Error",
          description: "Image size should be less than 5MB",
          duration: 4000
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      // Implement profile update logic here
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call
      showToast.success({
        title: "Success",
        description: "Profile updated successfully",
        duration: 3000
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      showToast.error({
        title: "Update Failed",
        description: "Failed to update profile",
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
          <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Profile</h2>
          <p className="text-muted-foreground mt-1">
            Manage your profile information and preferences
          </p>
        </div>
        <Button onClick={handleProfileUpdate} disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group w-fit mx-auto">
                  <div 
                    className="relative h-32 w-32 rounded-full transition-all duration-300 group-hover:scale-105 p-[3px] bg-gradient-to-r from-blue-500/50 to-purple-500/50 group-hover:from-blue-500 group-hover:to-purple-500 dark:from-blue-400/50 dark:to-purple-400/50 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] cursor-pointer"
                    onClick={handleImageClick}
                  >
                    <div className="h-full w-full flex items-center justify-center rounded-full overflow-hidden">
                      <Image
                        src={imagePreview || profile.profile_picture || "/placeholder-user.jpg"}
                        alt=""
                        width={320}
                        height={320}
                        className="h-full w-full object-cover scale-125"
                        priority
                        unoptimized
                        quality={100}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full">
                      <Camera className="h-8 w-8 text-white drop-shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                    </div>
                  </div>
                  <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-muted-foreground transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400">
                    Click to upload new profile picture
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Personal Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>

              {/* Admin Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profile.department}
                    onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold mb-1">{stats.total_users}</div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold mb-1">{stats.active_providers}</div>
                  <p className="text-sm text-muted-foreground">Active Providers</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <UserCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold mb-1">{stats.pending_approvals}</div>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold mb-1">{stats.system_health}%</div>
                  <p className="text-sm text-muted-foreground">System Health</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Security Settings
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                User Management
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                View Logs
              </Button>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline items={activities} />
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Account Secure</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Last login: {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">2FA Status</span>
                </div>
                <span className="text-sm font-medium text-yellow-500">
                  Not Enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Account Activity</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Normal
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 