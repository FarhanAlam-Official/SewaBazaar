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
import { Camera, Bell, Shield, Moon, Sun, Languages, RefreshCw, Check, Eye, EyeOff, LogOut, Smartphone, KeyRound, Lock } from "lucide-react"
import Image from "next/image"
import api from "@/services/api"
import { showToast } from "@/components/ui/enhanced-toast"
import { settingsApi } from "@/services/settings.api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  // Preferences state
  const [prefLoading, setPrefLoading] = useState(false)
  const [prefSaving, setPrefSaving] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState<string | undefined>(undefined)

  // Notifications state
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(true)
  const [topics, setTopics] = useState<string[]>(["bookings","messages","promotions"]) 
  const [isLoading, setIsLoading] = useState(false)
  // Change password state
  const [cpCurrent, setCpCurrent] = useState("")
  const [cpNew, setCpNew] = useState("")
  const [cpConfirm, setCpConfirm] = useState("")
  const [cpSaving, setCpSaving] = useState(false)
  const [showPwd, setShowPwd] = useState<{current:boolean; next:boolean; confirm:boolean}>({current:false,next:false,confirm:false})
  // Sessions & 2FA
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [twoFAStatus, setTwoFAStatus] = useState<{enabled:boolean; method?:string}>({enabled:false})
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [twoFAModalOpen, setTwoFAModalOpen] = useState(false)
  const [twoFAMethod, setTwoFAMethod] = useState<'totp'|'sms'>('totp')
  const [twoFAQrUrl, setTwoFAQrUrl] = useState<string | null>(null)
  const [twoFACode, setTwoFACode] = useState("")
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

  // Load preferences and notifications
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setPrefLoading(true)
        const pref = await settingsApi.getPreferences()
        if (isMounted && pref) {
          if (pref.theme) setTheme(pref.theme)
          if (pref.language) setLanguage(pref.language)
          if (pref.timezone) setTimezone(pref.timezone)
        }
      } catch (e: any) {
        // silent; user may not have prefs yet
      } finally {
        setPrefLoading(false)
      }

      try {
        setNotifLoading(true)
        const ns = await settingsApi.getNotificationSettings()
        if (isMounted && ns) {
          if (typeof ns.email_enabled === 'boolean') setEmailEnabled(ns.email_enabled)
          if (typeof ns.push_enabled === 'boolean') setPushEnabled(ns.push_enabled)
          if (Array.isArray(ns.topics)) setTopics(ns.topics)
        }
      } catch (e: any) {
        // silent; default switches apply
      } finally {
        setNotifLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  const savePreferences = async () => {
    try {
      setPrefSaving(true)
      await settingsApi.updatePreferences({ theme, language, timezone })
      showToast.success({ title: "Preferences saved" })
    } catch (e: any) {
      showToast.error({ title: "Failed to save preferences", description: e.message })
    } finally {
      setPrefSaving(false)
    }
  }

  const saveNotifications = async () => {
    try {
      setNotifSaving(true)
      await settingsApi.updateNotificationSettings({ email_enabled: emailEnabled, push_enabled: pushEnabled, topics })
      showToast.success({ title: "Notifications saved" })
    } catch (e: any) {
      showToast.error({ title: "Failed to save notifications", description: e.message })
    } finally {
      setNotifSaving(false)
    }
  }

  const toggleTopic = (key: string) => {
    setTopics(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key])
  }

  // Security: change password
  const handleChangePassword = async () => {
    if (!cpCurrent || !cpNew || !cpConfirm) {
      showToast.error({ title: "Please fill all fields" })
      return
    }
    if (cpNew !== cpConfirm) {
      showToast.error({ title: "Passwords do not match" })
      return
    }
    if (cpNew.length < 8) {
      showToast.error({ title: "Password too short", description: "Use at least 8 characters" })
      return
    }
    try {
      setCpSaving(true)
      await settingsApi.changePassword({ current_password: cpCurrent, new_password: cpNew })
      setCpCurrent("")
      setCpNew("")
      setCpConfirm("")
      showToast.success({ title: "Password updated" })
    } catch (e:any) {
      showToast.error({ title: "Failed to update password", description: e.message })
    } finally {
      setCpSaving(false)
    }
  }

  // Security: sessions & 2FA loaders
  const loadSecurity = async () => {
    try {
      setSessionsLoading(true)
      const [sess, twofa] = await Promise.allSettled([settingsApi.getSessions(), settingsApi.get2FAStatus()])
      if (sess.status === 'fulfilled') setSessions(sess.value)
      if (twofa.status === 'fulfilled' && twofa.value) setTwoFAStatus({ enabled: !!twofa.value.enabled, method: twofa.value.method })
    } catch {}
    finally { setSessionsLoading(false) }
  }

  useEffect(() => { loadSecurity() }, [])

  const revokeSession = async (id: string) => {
    try {
      await settingsApi.revokeSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      showToast.success({ title: "Session revoked" })
    } catch (e:any) {
      showToast.error({ title: "Failed to revoke", description: e.message })
    }
  }

  // 2FA flows
  const openEnable2FA = async () => {
    try {
      setTwoFALoading(true)
      setTwoFAMethod('totp')
      setTwoFAQrUrl(null)
      setTwoFACode("")
      setTwoFAModalOpen(true)
      const resp = await settingsApi.enable2FA({ method: 'totp' })
      const url = resp?.data?.otpauth_url || null
      setTwoFAQrUrl(url)
    } catch (e:any) {
      showToast.error({ title: 'Failed to start 2FA', description: e.message })
      setTwoFAModalOpen(false)
    } finally { setTwoFALoading(false) }
  }

  const verify2FA = async () => {
    if (!twoFACode.trim()) {
      showToast.error({ title: 'Enter the verification code' })
      return
    }
    try {
      setTwoFALoading(true)
      await settingsApi.verify2FA({ code: twoFACode.trim() })
      setTwoFAStatus({ enabled: true, method: twoFAMethod })
      setTwoFAModalOpen(false)
      showToast.success({ title: 'Two-factor authentication enabled' })
    } catch (e:any) {
      showToast.error({ title: 'Verification failed', description: e.message })
    } finally { setTwoFALoading(false) }
  }

  const disable2FA = async () => {
    try {
      setTwoFALoading(true)
      await settingsApi.disable2FA({})
      setTwoFAStatus({ enabled: false })
      showToast.success({ title: 'Two-factor authentication disabled' })
    } catch (e:any) {
      showToast.error({ title: 'Failed to disable 2FA', description: e.message })
    } finally { setTwoFALoading(false) }
  }

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
    setFieldErrors({})
    
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
      showToast.success({
        title: "Success",
        description: "Profile updated successfully!",
        duration: 3000
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      const data = error?.response?.data
      if (data && typeof data === 'object') {
        const errs: Record<string, string> = {}
        Object.keys(data).forEach((k) => {
          const v = Array.isArray(data[k]) ? data[k][0] : (typeof data[k] === 'string' ? data[k] : '')
          if (v) errs[k] = v
        })
        setFieldErrors(errs)
      }
      showToast.error({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
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
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-lg shadow-sm">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background transition-colors duration-200 hover:bg-background/70">
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-background transition-colors duration-200 hover:bg-background/70">
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-background transition-colors duration-200 hover:bg-background/70">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-background transition-colors duration-200 hover:bg-background/70">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="transition-all duration-200 hover:shadow-md">
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
                      className="transition-colors hover:border-primary/30 focus:border-primary"
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
                      className="transition-colors hover:border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email}
                      disabled
                      className="opacity-90"
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
                      className="transition-colors hover:border-primary/30 focus:border-primary"
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
                      className="transition-colors hover:border-primary/30 focus:border-primary"
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
                      className="transition-colors hover:border-primary/30 focus:border-primary"
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
                      className="transition-colors hover:border-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
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
                    className="hover:shadow-sm">
                    Reset Changes
                  </Button>
                  <Button type="submit" disabled={isLoading} className="min-w-[120px] hover:shadow-sm">
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
          <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
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
                <div className="flex items-center gap-2">
                  <Button type="button" variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')} className="gap-1 transition-transform hover:-translate-y-0.5">
                    <Sun className="h-4 w-4" /> Light
                  </Button>
                  <Button type="button" variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')} className="gap-1 transition-transform hover:-translate-y-0.5">
                    <Moon className="h-4 w-4" /> Dark
                  </Button>
                  <Button type="button" variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('system')} className="gap-1 transition-transform hover:-translate-y-0.5">
                    <RefreshCw className="h-4 w-4" /> System
                  </Button>
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
                  <select className="form-select rounded-md border-gray-300 dark:border-gray-700 transition-colors hover:border-primary/30 focus:border-primary" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="en">English</option>
                    <option value="ne">नेपाली</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Timezone</Label>
                  <p className="text-sm text-muted-foreground">Set your local timezone</p>
                </div>
                <input
                  className="form-input rounded-md border-gray-300 dark:border-gray-700 px-3 py-2 transition-colors hover:border-primary/30 focus:border-primary"
                  placeholder="e.g., Asia/Kathmandu"
                  value={timezone || ""}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  // reload from server
                  (async () => {
                    try {
                      setPrefLoading(true)
                      const pref = await settingsApi.getPreferences()
                      if (pref) {
                        if (pref.theme) setTheme(pref.theme)
                        if (pref.language) setLanguage(pref.language)
                        if (pref.timezone) setTimezone(pref.timezone)
                      }
                    } finally { setPrefLoading(false) }
                  })()
                }} disabled={prefLoading || prefSaving} className="hover:shadow-sm">
                  Refresh
                </Button>
                <Button type="button" onClick={savePreferences} disabled={prefLoading || prefSaving} className="min-w-[120px] hover:shadow-sm">
                  {prefSaving ? (<><LoadingSpinner size="sm" className="mr-2"/>Saving...</>) : (<><Check className="h-4 w-4 mr-2"/>Save</>)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
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
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications
                  </p>
                </div>
                <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
              </div>

              <div className="space-y-4">
                <Label>Notification Types</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 transition-transform hover:-translate-y-0.5">
                    <input type="checkbox" id="bookings" className="rounded" checked={topics.includes('bookings')} onChange={() => toggleTopic('bookings')} />
                    <label htmlFor="bookings">Booking updates</label>
                  </div>
                  <div className="flex items-center space-x-2 transition-transform hover:-translate-y-0.5">
                    <input type="checkbox" id="messages" className="rounded" checked={topics.includes('messages')} onChange={() => toggleTopic('messages')} />
                    <label htmlFor="messages">New messages</label>
                  </div>
                  <div className="flex items-center space-x-2 transition-transform hover:-translate-y-0.5">
                    <input type="checkbox" id="promotions" className="rounded" checked={topics.includes('promotions')} onChange={() => toggleTopic('promotions')} />
                    <label htmlFor="promotions">Promotions and offers</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  (async () => {
                    try {
                      setNotifLoading(true)
                      const ns = await settingsApi.getNotificationSettings()
                      if (ns) {
                        if (typeof ns.email_enabled === 'boolean') setEmailEnabled(ns.email_enabled)
                        if (typeof ns.push_enabled === 'boolean') setPushEnabled(ns.push_enabled)
                        if (Array.isArray(ns.topics)) setTopics(ns.topics)
                      }
                    } finally { setNotifLoading(false) }
                  })()
                }} disabled={notifLoading || notifSaving} className="hover:shadow-sm">Refresh</Button>
                <Button type="button" onClick={saveNotifications} disabled={notifLoading || notifSaving} className="min-w-[120px] hover:shadow-sm">
                  {notifSaving ? (<><LoadingSpinner size="sm" className="mr-2"/>Saving...</>) : (<>Save</>)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="transition-all duration-200 hover:shadow-md">
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
                    <div className="relative">
                      <Input id="currentPassword" type={showPwd.current ? 'text' : 'password'} placeholder="Enter your current password" value={cpCurrent} onChange={(e)=>setCpCurrent(e.target.value)} className="transition-colors hover:border-primary/30 focus:border-primary" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={()=>setShowPwd(p=>({...p,current:!p.current}))}>{showPwd.current ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input id="newPassword" type={showPwd.next ? 'text' : 'password'} placeholder="Enter your new password" value={cpNew} onChange={(e)=>setCpNew(e.target.value)} className="transition-colors hover:border-primary/30 focus:border-primary" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={()=>setShowPwd(p=>({...p,next:!p.next}))}>{showPwd.next ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showPwd.confirm ? 'text' : 'password'} placeholder="Confirm your new password" value={cpConfirm} onChange={(e)=>setCpConfirm(e.target.value)} className="transition-colors hover:border-primary/30 focus:border-primary" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={()=>setShowPwd(p=>({...p,confirm:!p.confirm}))}>{showPwd.confirm ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
                    </div>
                  </div>
                  <Button type="button" onClick={handleChangePassword} disabled={cpSaving} className="min-w-[140px] hover:shadow-sm">{cpSaving ? (<><LoadingSpinner size="sm" className="mr-2"/>Updating...</>) : (<>Update Password</>)}</Button>
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
                  <div className="flex items-center gap-3">
                    <Badge variant={twoFAStatus.enabled ? 'default' : 'outline'}>{twoFAStatus.enabled ? (twoFAStatus.method || 'Enabled') : 'Disabled'}</Badge>
                    {twoFAStatus.enabled ? (
                      <Button type="button" variant="outline" size="sm" onClick={disable2FA} disabled={twoFALoading} className="gap-2 hover:shadow-sm"><Lock className="h-4 w-4"/> Disable</Button>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={openEnable2FA} disabled={twoFALoading} className="gap-2 hover:shadow-sm"><KeyRound className="h-4 w-4"/> Enable</Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Active Sessions</h3>
                <div className="space-y-3">
                  {sessionsLoading ? (
                    <div className="text-sm text-muted-foreground">Loading sessions...</div>
                  ) : sessions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No other active sessions.</div>
                  ) : (
                    sessions.map((s)=> (
                      <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-muted/30">
                        <div>
                          <p className="font-medium">{s.user_agent || 'Device'}</p>
                          <p className="text-sm text-muted-foreground">{s.ip || 'IP unknown'} • {s.city || ''} {s.current ? '• Current session' : ''}</p>
                        </div>
                        {s.current ? (
                          <Shield className="h-5 w-5 text-green-500" />
                        ) : (
                          <Button variant="outline" size="sm" onClick={()=>revokeSession(s.id)} className="gap-2 hover:shadow-sm"><LogOut className="h-4 w-4"/> Revoke</Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Enable Modal */}
      <Dialog open={twoFAModalOpen} onOpenChange={setTwoFAModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Scan this QR code with your authenticator app and enter the 6-digit code.</div>
            {twoFALoading ? (
              <div className="py-8 flex justify-center"><LoadingSpinner/></div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                {twoFAQrUrl ? (
                  // Using a QR generator URL for display only; code verified via backend
                  <img src={`https://quickchart.io/qr?text=${encodeURIComponent(twoFAQrUrl)}&size=240`} alt="2FA QR" className="rounded border shadow-sm" />
                ) : (
                  <div className="text-xs text-muted-foreground">Provisioning info unavailable</div>
                )}
                <div className="w-full">
                  <Label>Verification Code</Label>
                  <Input placeholder="123456" value={twoFACode} onChange={(e)=>setTwoFACode(e.target.value)} className="transition-colors hover:border-primary/30 focus:border-primary" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setTwoFAModalOpen(false)} className="hover:shadow-sm">Cancel</Button>
            <Button onClick={verify2FA} disabled={twoFALoading || !twoFACode.trim()} className="min-w-[120px] hover:shadow-sm">{twoFALoading ? (<><LoadingSpinner size="sm" className="mr-2"/>Verifying...</>) : 'Verify'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 