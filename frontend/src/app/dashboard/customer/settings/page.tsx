"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Camera, Bell, Shield, Moon, Sun, Languages } from "lucide-react"
import Image from "next/image"
import api from "@/services/api"
import { toast } from "sonner"

interface FormData {
  first_name: string
  last_name: string
  phone: string
  profile_picture: File | null
  profile: {
    bio: string
    address: string
    city: string
    date_of_birth: string
  }
}

export default function CustomerSettingsPage() {
  const { user, loading, refreshUser } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isEmailNotifications, setIsEmailNotifications] = useState(true)
  const [isPushNotifications, setIsPushNotifications] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<FormData>({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    profile_picture: null,
    profile: {
      bio: user?.profile?.bio || "",
      address: user?.profile?.address || "",
      city: user?.profile?.city || "",
      date_of_birth: user?.profile?.date_of_birth || "",
    }
  })

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        profile_picture: null,
        profile: {
          bio: user.profile?.bio || "",
          address: user.profile?.address || "",
          city: user.profile?.city || "",
          date_of_birth: user.profile?.date_of_birth || "",
        }
      })
      // Initialize image preview with current profile picture
      if (user.profile_picture) {
        setImagePreview(user.profile_picture)
      }
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith("profile.")) {
      const profileField = name.split(".")[1]
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Store the file in formData instead of uploading immediately
      setFormData(prev => ({
        ...prev,
        profile_picture: file
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Create form data with all fields including the image if it exists
      const submitData = new FormData()
      submitData.append("first_name", formData.first_name)
      submitData.append("last_name", formData.last_name)
      submitData.append("phone", formData.phone)
      submitData.append("profile.bio", formData.profile.bio)
      submitData.append("profile.address", formData.profile.address)
      submitData.append("profile.city", formData.profile.city)
      submitData.append("profile.date_of_birth", formData.profile.date_of_birth)
      
      if (formData.profile_picture) {
        submitData.append("profile_picture", formData.profile_picture)
      }

      await api.put('/auth/users/update_profile/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      await refreshUser()
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile. Please try again.")
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
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background">
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-background">
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-background">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information and profile picture.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <div 
                      className="relative h-32 w-32 rounded-full transition-all duration-300 group-hover:scale-105 p-[3px] bg-gradient-to-r from-blue-500/50 to-purple-500/50 group-hover:from-blue-500 group-hover:to-purple-500 dark:from-blue-400/50 dark:to-purple-400/50 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] cursor-pointer"
                      onClick={handleImageClick}
                    >
                      <div className="relative h-full w-full rounded-full overflow-hidden bg-background">
                        <Image
                          src={imagePreview || user?.profile_picture_url || "/placeholder.svg"}
                          alt="Profile"
                          width={320}
                          height={320}
                          className="h-full w-full object-cover scale-125"
                          priority
                          unoptimized
                          quality={100}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Camera className="h-8 w-8 text-white drop-shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400">
                    Click to upload new profile picture
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile.address">Address</Label>
                    <Input
                      id="profile.address"
                      name="profile.address"
                      value={formData.profile.address}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile.city">City</Label>
                    <Input
                      id="profile.city"
                      name="profile.city"
                      value={formData.profile.city}
                      onChange={handleInputChange}
                      placeholder="Enter your city"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profile.bio">Bio</Label>
                    <Textarea
                      id="profile.bio"
                      name="profile.bio"
                      value={formData.profile.bio}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setFormData({
                        first_name: user?.first_name || "",
                        last_name: user?.last_name || "",
                        phone: user?.phone || "",
                        profile_picture: null,
                        profile: {
                          bio: user?.profile?.bio || "",
                          address: user?.profile?.address || "",
                          city: user?.profile?.city || "",
                          date_of_birth: user?.profile?.date_of_birth || "",
                        }
                      })
                      setImagePreview(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                    disabled={isLoading}
                  >
                    Reset Changes
                  </Button>
                  <Button type="submit" disabled={isLoading} className="min-w-[120px]">
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
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your app experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose between light and dark mode
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                  />
                  <Moon className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Language</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred language
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Languages className="h-4 w-4" />
                  <select className="form-select rounded-md border-gray-300 dark:border-gray-700">
                    <option value="en">English</option>
                    <option value="ne">नेपाली</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={isEmailNotifications}
                  onCheckedChange={setIsEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications
                  </p>
                </div>
                <Switch
                  checked={isPushNotifications}
                  onCheckedChange={setIsPushNotifications}
                />
              </div>

              <div className="space-y-4">
                <Label>Notification Types</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="bookings" className="rounded" defaultChecked />
                    <label htmlFor="bookings">Booking updates</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="messages" className="rounded" defaultChecked />
                    <label htmlFor="messages">New messages</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="promotions" className="rounded" defaultChecked />
                    <label htmlFor="promotions">Promotions and offers</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Change Password</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter your current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter your new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                    />
                  </div>
                  <Button>Update Password</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Active Sessions</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        Windows • Chrome • Kathmandu, Nepal
                      </p>
                    </div>
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 