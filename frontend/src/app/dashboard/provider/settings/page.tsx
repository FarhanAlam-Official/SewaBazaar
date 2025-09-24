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
import { showToast } from "@/components/ui/enhanced-toast"
import ProviderSettingsLoading from "./loading"
import {
  Bell,
  Clock,
  CreditCard,
  Globe,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  Wallet,
  Camera,
  MapPin,
  Calendar,
  Settings,
  Check,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react"
import Image from "next/image"
import api from "@/services/api"

interface FormData {
  first_name: string
  last_name: string
  phone: string
  profile_picture: File | null
  profile: {
    bio: string
    company_name: string
    display_name: string
    years_of_experience: number
    certifications: string
    location_city: string
    service_radius: string
    primary_service_area: string
    show_service_area: boolean
    auto_accept_bookings: boolean
    min_booking_notice: string
    max_daily_bookings: number
    default_service_duration: string
  }
}

interface NotificationPreferences {
  new_booking: boolean
  email: boolean
  sms: boolean
}

interface PaymentData {
  payout_schedule: string
}

interface SecurityData {
  two_factor_auth: boolean
  current_password: string
  new_password: string
  confirm_password: string
  show_passwords: {
    current: boolean
    new: boolean
    confirm: boolean
  }
}

export default function ProviderSettings() {
  const { user, loading, refreshUser } = useAuth()
  // Using enhanced toast instead of useToast
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // Loading states
  const [profileLoading, setProfileLoading] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [preferencesLoading, setPreferencesLoading] = useState(false)
  
  // Saving states
  const [profileSaving, setProfileSaving] = useState(false)
  const [notificationSaving, setNotificationSaving] = useState(false)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [securitySaving, setSecuritySaving] = useState(false)
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    phone: "",
    profile_picture: null,
    profile: {
      bio: "",
      company_name: "",
      display_name: "",
      years_of_experience: 0,
      certifications: "",
      location_city: "",
      service_radius: "10 km",
      primary_service_area: "",
      show_service_area: true,
      auto_accept_bookings: false,
      min_booking_notice: "2 hours",
      max_daily_bookings: 5,
      default_service_duration: "2 hours"
    }
  })
  
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    new_booking: true,
    email: true,
    sms: false
  })
  
  const [paymentData, setPaymentData] = useState<PaymentData>({
    payout_schedule: "Weekly"
  })
  
  const [securityData, setSecurityData] = useState<SecurityData>({
    two_factor_auth: false,
    current_password: "",
    new_password: "",
    confirm_password: "",
    show_passwords: {
      current: false,
      new: false,
      confirm: false
    }
  })

  // Initialize form data from user object
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        profile_picture: null,
        profile: {
          bio: user.profile?.bio || "",
          company_name: user.profile?.company_name || "",
          display_name: user.profile?.display_name || "",
          years_of_experience: user.profile?.years_of_experience || 0,
          certifications: user.profile?.certifications ? JSON.stringify(user.profile.certifications) : "",
          location_city: user.profile?.location_city || "",
          service_radius: user.profile?.service_radius || "10 km",
          primary_service_area: user.profile?.primary_service_area || "",
          show_service_area: user.profile?.show_service_area ?? true,
          auto_accept_bookings: user.profile?.auto_accept_bookings ?? false,
          min_booking_notice: user.profile?.min_booking_notice || "2 hours",
          max_daily_bookings: user.profile?.max_daily_bookings || 5,
          default_service_duration: user.profile?.default_service_duration || "2 hours"
        }
      })
      
      // Initialize image preview with current profile picture
      if (user.profile_picture_url) {
        setImagePreview(user.profile_picture_url)
      } else if (user.profile_picture) {
        setImagePreview(user.profile_picture)
      } else {
        setImagePreview(null)
      }
    }
  }, [user])

  // Add a useEffect to refresh user data when the component mounts
  useEffect(() => {
    if (!user && !loading) {
      refreshUser()
    }
  }, [user, loading, refreshUser])

  // Load notification preferences
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      try {
        setNotificationLoading(true)
        // In a real app, this would fetch from an API
        // const response = await api.get('/provider/notification-preferences/')
        // setNotificationPreferences(response.data)
      } catch (error) {
        console.error("Failed to load notification preferences:", error)
        showToast.error({
          title: "Error",
          description: "Failed to load notification preferences"
        })
      } finally {
        setNotificationLoading(false)
      }
    }
    
    if (user) {
      loadNotificationPreferences()
    }
  }, [user])

  // Load payment settings
  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        setPaymentLoading(true)
        // In a real app, this would fetch from an API
        // const response = await api.get('/provider/payment-settings/')
        // setPaymentData(response.data)
      } catch (error) {
        console.error("Failed to load payment settings:", error)
        showToast.error({
          title: "Error",
          description: "Failed to load payment settings"
        })
      } finally {
        setPaymentLoading(false)
      }
    }
    
    if (user) {
      loadPaymentSettings()
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name.startsWith("profile.")) {
      const profileField = name.split(".")[1] as keyof typeof formData.profile
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: profileField === 'max_daily_bookings' || profileField === 'years_of_experience' ? parseInt(value) || 0 : value
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast.error({
          title: "Image Error",
          description: "Image size should be less than 5MB"
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Store the file in formData for later submission
      setFormData(prev => ({
        ...prev,
        profile_picture: file
      }))
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setSecurityData(prev => ({
      ...prev,
      show_passwords: {
        ...prev.show_passwords,
        [field]: !prev.show_passwords[field]
      }
    }))
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    setFieldErrors({})
    
    try {
      // Create form data with all fields including the image if it exists
      const submitData = new FormData()
      submitData.append("first_name", formData.first_name)
      submitData.append("last_name", formData.last_name)
      submitData.append("phone", formData.phone)
      submitData.append("profile.bio", formData.profile.bio)
      submitData.append("profile.company_name", formData.profile.company_name)
      submitData.append("profile.display_name", formData.profile.display_name)
      submitData.append("profile.years_of_experience", formData.profile.years_of_experience.toString())
      submitData.append("profile.certifications", formData.profile.certifications)
      submitData.append("profile.location_city", formData.profile.location_city)
      submitData.append("profile.service_radius", formData.profile.service_radius)
      submitData.append("profile.primary_service_area", formData.profile.primary_service_area)
      submitData.append("profile.show_service_area", formData.profile.show_service_area.toString())
      submitData.append("profile.auto_accept_bookings", formData.profile.auto_accept_bookings.toString())
      submitData.append("profile.min_booking_notice", formData.profile.min_booking_notice)
      submitData.append("profile.max_daily_bookings", formData.profile.max_daily_bookings.toString())
      submitData.append("profile.default_service_duration", formData.profile.default_service_duration)
      
      if (formData.profile_picture) {
        submitData.append("profile_picture", formData.profile_picture)
      }

      const response = await api.put('/auth/users/update_profile/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      // Refresh user data after successful update
      await refreshUser()
      
      // Show success toast
      showToast.success({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!"
      })
      
      // Reset the profile picture state after successful update
      setFormData(prev => ({
        ...prev,
        profile_picture: null
      }))
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Profile update failed:", error)
      // Show error notification to user
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
        description: error?.response?.data?.detail || "Failed to update profile. Please try again."
      })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setNotificationSaving(true)
    
    try {
      // In a real app, this would send to an API
      // await api.put('/provider/notification-preferences/', notificationPreferences)
      showToast.success({
        title: "Preferences Saved",
        description: "Notification preferences saved successfully!"
      })
    } catch (error) {
      showToast.error({
        title: "Error",
        description: "Failed to save notification preferences"
      })
    } finally {
      setNotificationSaving(false)
    }
  }

  const handleSavePaymentSettings = async () => {
    setPaymentSaving(true)
    
    try {
      // In a real app, this would send to an API
      // await api.put('/provider/payment-settings/', paymentData)
      showToast.success({
        title: "Settings Saved",
        description: "Payment settings saved successfully!"
      })
    } catch (error) {
      showToast.error({
        title: "Error",
        description: "Failed to save payment settings"
      })
    } finally {
      setPaymentSaving(false)
    }
  }

  const handleSaveServicePreferences = async () => {
    setPreferencesSaving(true)
    
    try {
      // Create form data for service preferences
      const submitData = new FormData()
      submitData.append("profile.service_radius", formData.profile.service_radius)
      submitData.append("profile.primary_service_area", formData.profile.primary_service_area)
      submitData.append("profile.show_service_area", formData.profile.show_service_area.toString())
      submitData.append("profile.auto_accept_bookings", formData.profile.auto_accept_bookings.toString())
      submitData.append("profile.min_booking_notice", formData.profile.min_booking_notice)
      submitData.append("profile.max_daily_bookings", formData.profile.max_daily_bookings.toString())
      submitData.append("profile.default_service_duration", formData.profile.default_service_duration)

      const response = await api.put('/auth/users/update_profile/', submitData)
      
      // Refresh user data after successful update
      await refreshUser()
      
      // Show success toast
      showToast.success({
        title: "Preferences Updated",
        description: "Service preferences saved successfully!"
      })
    } catch (error: any) {
      console.error("Service preferences update failed:", error)
      showToast.error({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to save service preferences"
      })
    } finally {
      setPreferencesSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!securityData.current_password || !securityData.new_password || !securityData.confirm_password) {
      showToast.error({
        title: "Missing Fields",
        description: "Please fill all password fields"
      })
      return
    }
    if (securityData.new_password !== securityData.confirm_password) {
      showToast.error({
        title: "Password Mismatch",
        description: "Passwords do not match"
      })
      return
    }
    if (securityData.new_password.length < 8) {
      showToast.error({
        title: "Password Too Short",
        description: "Password must be at least 8 characters"
      })
      return
    }
    
    setSecuritySaving(true)
    
    try {
      await api.post('/auth/users/change_password/', {
        current_password: securityData.current_password,
        new_password: securityData.new_password
      })
      showToast.success({
        title: "Password Updated",
        description: "Your password has been updated successfully!"
      })
      // Reset password fields
      setSecurityData(prev => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: ""
      }))
    } catch (error: any) {
      showToast.error({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to update password"
      })
    } finally {
      setSecuritySaving(false)
    }
  }

  if (loading) {
    return <ProviderSettingsLoading />
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 mb-2 leading-tight pb-1">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl shadow-sm w-full md:w-auto">
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-muted/80 hover:shadow-md px-4 py-2 font-medium flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="business" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-muted/80 hover:shadow-md px-4 py-2 font-medium flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-muted/80 hover:shadow-md px-4 py-2 font-medium flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-muted/80 hover:shadow-md px-4 py-2 font-medium flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-muted/80 hover:shadow-md px-4 py-2 font-medium flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="preferences" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-muted/80 hover:shadow-md px-4 py-2 font-medium flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Service Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card className="transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 pb-6">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your personal information and profile picture.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-8">
                <div className="flex flex-col items-center space-y-6">
                  <div 
                    className="relative group cursor-pointer"
                    onClick={handleImageClick}
                  >
                    <div className="relative h-32 w-32 rounded-full transition-all duration-300 group-hover:scale-105 p-[3px] bg-gradient-to-r from-indigo-500/50 to-purple-500/50 group-hover:from-indigo-500 group-hover:to-purple-500 dark:from-indigo-400/50 dark:to-purple-400/50 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                  >
                      <div className="relative h-full w-full rounded-full overflow-hidden bg-background">
                        <Image
                          src={imagePreview || user?.profile_picture || "/placeholder.svg"}
                          alt="Profile"
                          width={320}
                          height={320}
                          className="h-full w-full object-cover scale-125"
                          unoptimized
                          quality={100}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Camera className="h-8 w-8 text-white drop-shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                    {(profileSaving || profileLoading) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-500 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400">
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
                    <Label htmlFor="first_name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      First Name
                    </Label>
                    <Input 
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                    {fieldErrors.first_name && (
                      <p className="text-sm text-red-500">{fieldErrors.first_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Last Name
                    </Label>
                    <Input 
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                    {fieldErrors.last_name && (
                      <p className="text-sm text-red-500">{fieldErrors.last_name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-indigo-500" />
                      Email
                    </Label>
                    <Input 
                      id="email"
                      type="email" 
                      value={user?.email || ""}
                      disabled
                      className="opacity-90 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-indigo-500" />
                      Phone
                    </Label>
                    <Input 
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                    {fieldErrors.phone && (
                      <p className="text-sm text-red-500">{fieldErrors.phone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile.company_name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Company Name
                    </Label>
                    <Input 
                      id="profile.company_name"
                      name="profile.company_name"
                      value={formData.profile.company_name}
                      onChange={handleInputChange}
                      placeholder="Enter your company name"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile.display_name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Display Name
                    </Label>
                    <Input 
                      id="profile.display_name"
                      name="profile.display_name"
                      value={formData.profile.display_name}
                      onChange={handleInputChange}
                      placeholder="Enter your display name"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile.years_of_experience" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Years of Experience
                    </Label>
                    <Input 
                      id="profile.years_of_experience"
                      name="profile.years_of_experience"
                      type="number"
                      value={formData.profile.years_of_experience}
                      onChange={handleInputChange}
                      placeholder="Enter years of experience"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile.location_city" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-indigo-500" />
                      Location City
                    </Label>
                    <Input 
                      id="profile.location_city"
                      name="profile.location_city"
                      value={formData.profile.location_city}
                      onChange={handleInputChange}
                      placeholder="Enter your location city"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile.certifications" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Certifications
                    </Label>
                    <Textarea 
                      id="profile.certifications"
                      name="profile.certifications"
                      value={formData.profile.certifications}
                      onChange={handleInputChange}
                      placeholder="Enter your certifications (comma separated)"
                      className="h-24 transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profile.bio" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Bio
                    </Label>
                    <Textarea 
                      id="profile.bio"
                      name="profile.bio"
                      value={formData.profile.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself"
                      className="h-24 transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Reset form to initial values
                      if (user) {
                        setFormData({
                          first_name: user.first_name || "",
                          last_name: user.last_name || "",
                          phone: user.phone || "",
                          profile_picture: null,
                          profile: {
                            bio: user.profile?.bio || "",
                            company_name: user.profile?.company_name || "",
                            display_name: user.profile?.display_name || "",
                            years_of_experience: user.profile?.years_of_experience || 0,
                            certifications: user.profile?.certifications ? JSON.stringify(user.profile.certifications) : "",
                            location_city: user.profile?.location_city || "",
                            service_radius: user.profile?.service_radius || "10 km",
                            primary_service_area: user.profile?.primary_service_area || "",
                            show_service_area: user.profile?.show_service_area ?? true,
                            auto_accept_bookings: user.profile?.auto_accept_bookings ?? false,
                            min_booking_notice: user.profile?.min_booking_notice || "2 hours",
                            max_daily_bookings: user.profile?.max_daily_bookings || 5,
                            default_service_duration: user.profile?.default_service_duration || "2 hours"
                          }
                        })
                        setImagePreview(user.profile_picture_url || user.profile_picture || null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }
                    }}
                    disabled={profileSaving || profileLoading}
                    className="hover:shadow-md transition-all duration-300 rounded-lg group"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                    Reset Changes
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={profileSaving || profileLoading}
                    className="min-w-[140px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {profileSaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Profile Settings */}
        <TabsContent value="business">
          <Card className="transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 pb-6">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Business Profile Settings
              </CardTitle>
              <CardDescription>
                Update your business information and professional details.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="profile.company_name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Company Name
                    </Label>
                    <Input 
                      id="profile.company_name"
                      name="profile.company_name"
                      value={formData.profile.company_name}
                      onChange={handleInputChange}
                      placeholder="Enter your company name"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile.display_name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Display Name
                    </Label>
                    <Input 
                      id="profile.display_name"
                      name="profile.display_name"
                      value={formData.profile.display_name}
                      onChange={handleInputChange}
                      placeholder="Enter your display name"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile.years_of_experience" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Years of Experience
                    </Label>
                    <Input 
                      id="profile.years_of_experience"
                      name="profile.years_of_experience"
                      type="number"
                      value={formData.profile.years_of_experience}
                      onChange={handleInputChange}
                      placeholder="Enter years of experience"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile.location_city" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-indigo-500" />
                      Location City
                    </Label>
                    <Input 
                      id="profile.location_city"
                      name="profile.location_city"
                      value={formData.profile.location_city}
                      onChange={handleInputChange}
                      placeholder="Enter your location city"
                      className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profile.certifications" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Certifications
                    </Label>
                    <Textarea 
                      id="profile.certifications"
                      name="profile.certifications"
                      value={formData.profile.certifications}
                      onChange={handleInputChange}
                      placeholder="Enter your certifications (comma separated)"
                      className="h-24 transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Reset form to initial values
                      if (user) {
                        setFormData({
                          first_name: user.first_name || "",
                          last_name: user.last_name || "",
                          phone: user.phone || "",
                          profile_picture: null,
                          profile: {
                            bio: user.profile?.bio || "",
                            company_name: user.profile?.company_name || "",
                            display_name: user.profile?.display_name || "",
                            years_of_experience: user.profile?.years_of_experience || 0,
                            certifications: user.profile?.certifications ? JSON.stringify(user.profile.certifications) : "",
                            location_city: user.profile?.location_city || "",
                            service_radius: user.profile?.service_radius || "10 km",
                            primary_service_area: user.profile?.primary_service_area || "",
                            show_service_area: user.profile?.show_service_area ?? true,
                            auto_accept_bookings: user.profile?.auto_accept_bookings ?? false,
                            min_booking_notice: user.profile?.min_booking_notice || "2 hours",
                            max_daily_bookings: user.profile?.max_daily_bookings || 5,
                            default_service_duration: user.profile?.default_service_duration || "2 hours"
                          }
                        })
                      }
                    }}
                    disabled={profileSaving || profileLoading}
                    className="hover:shadow-md transition-all duration-300 rounded-lg group"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                    Reset Changes
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={profileSaving || profileLoading}
                    className="min-w-[140px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {profileSaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 pb-6">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    New Booking Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when you get new booking requests
                  </p>
                </div>
                <Switch 
                  checked={notificationPreferences.new_booking}
                  onCheckedChange={(checked) => 
                    setNotificationPreferences(prev => ({...prev, new_booking: checked}))
                  }
                  className="data-[state=checked]:bg-amber-500 transition-all duration-300"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive booking updates and reminders via email
                  </p>
                </div>
                <Switch 
                  checked={notificationPreferences.email}
                  onCheckedChange={(checked) => 
                    setNotificationPreferences(prev => ({...prev, email: checked}))
                  }
                  className="data-[state=checked]:bg-blue-500 transition-all duration-300"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-500" />
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive booking updates and reminders via SMS
                  </p>
                </div>
                <Switch 
                  checked={notificationPreferences.sms}
                  onCheckedChange={(checked) => 
                    setNotificationPreferences(prev => ({...prev, sms: checked}))
                  }
                  className="data-[state=checked]:bg-purple-500 transition-all duration-300"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Reset to default values
                    setNotificationPreferences({
                      new_booking: true,
                      email: true,
                      sms: false
                    })
                  }}
                  disabled={notificationSaving || notificationLoading}
                  className="hover:shadow-md transition-all duration-300 rounded-lg group"
                >
                  <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  Reset
                </Button>
                <Button 
                  onClick={handleSaveNotifications} 
                  disabled={notificationSaving || notificationLoading}
                  className="min-w-[140px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {notificationSaving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2"/>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2"/>
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments">
          <div className="grid gap-6">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 pb-6">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  Manage your payment methods for receiving payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-300">
                  <CreditCard className="h-6 w-6" />
                  <div className="flex-1">
                    <p className="font-medium">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/24</p>
                  </div>
                  <Button variant="outline">Remove</Button>
                </div>
                <Button className="w-full hover:shadow-md transition-all duration-300 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Payout Settings
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive your earnings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-300">
                  <Wallet className="h-6 w-6" />
                  <div className="flex-1">
                    <p className="font-medium">Bank Account</p>
                    <p className="text-sm text-muted-foreground">NIC Asia Bank **** 5678</p>
                  </div>
                  <Button variant="outline">Edit</Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payout_schedule" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    Payout Schedule
                  </Label>
                  <select 
                    id="payout_schedule"
                    name="payout_schedule"
                    className="w-full h-10 px-3 border transition-all duration-300 hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-lg"
                    value={paymentData.payout_schedule}
                    onChange={(e) => setPaymentData({ payout_schedule: e.target.value })}
                  >
                    <option>Weekly</option>
                    <option>Bi-weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Reset to default values
                      setPaymentData({
                        payout_schedule: "Weekly"
                      })
                    }}
                    disabled={paymentSaving || paymentLoading}
                    className="hover:shadow-md transition-all duration-300 rounded-lg group"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                    Reset
                  </Button>
                  <Button 
                    onClick={handleSavePaymentSettings} 
                    disabled={paymentSaving || paymentLoading}
                    className="min-w-[140px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                  >
                    {paymentSaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2"/>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2"/>
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 pb-6">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-6 p-5 rounded-xl bg-muted/30">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-500" />
                  Change Password
                </h3>
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-rose-500" />
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="current_password"
                        name="current_password"
                        type={securityData.show_passwords.current ? 'text' : 'password'} 
                        placeholder="Enter your current password" 
                        value={securityData.current_password} 
                        onChange={(e) => setSecurityData(prev => ({
                          ...prev,
                          current_password: e.target.value
                        }))}
                        className="transition-all duration-300 hover:border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 rounded-lg pr-10"
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {securityData.show_passwords.current ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-500" />
                      New Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="new_password"
                        name="new_password"
                        type={securityData.show_passwords.new ? 'text' : 'password'} 
                        placeholder="Enter your new password" 
                        value={securityData.new_password} 
                        onChange={(e) => setSecurityData(prev => ({
                          ...prev,
                          new_password: e.target.value
                        }))}
                        className="transition-all duration-300 hover:border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 rounded-lg pr-10"
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {securityData.show_passwords.new ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-500" />
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="confirm_password"
                        name="confirm_password"
                        type={securityData.show_passwords.confirm ? 'text' : 'password'} 
                        placeholder="Confirm your new password" 
                        value={securityData.confirm_password} 
                        onChange={(e) => setSecurityData(prev => ({
                          ...prev,
                          confirm_password: e.target.value
                        }))}
                        className="transition-all duration-300 hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 rounded-lg pr-10"
                      />
                      <button 
                        type="button" 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {securityData.show_passwords.confirm ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleChangePassword} 
                    disabled={securitySaving || securityLoading}
                    className="min-w-[160px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    {securitySaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2"/>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2"/>
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-6 p-5 rounded-xl bg-muted/30">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Two-Factor Authentication
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      Enable 2FA
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch 
                    checked={securityData.two_factor_auth}
                    onCheckedChange={(checked) => 
                      setSecurityData(prev => ({...prev, two_factor_auth: checked}))
                    }
                    className="data-[state=checked]:bg-blue-500 transition-all duration-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Preferences */}
        <TabsContent value="preferences">
          <div className="grid gap-6">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 pb-6">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Service Area
                </CardTitle>
                <CardDescription>
                  Define where you provide your services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="profile.service_radius" className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-amber-500" />
                    Service Radius
                  </Label>
                  <select 
                    id="profile.service_radius"
                    name="profile.service_radius"
                    className="w-full h-10 px-3 border transition-all duration-300 hover:border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 rounded-lg"
                    value={formData.profile.service_radius}
                    onChange={handleInputChange}
                  >
                    <option>5 km</option>
                    <option>10 km</option>
                    <option>15 km</option>
                    <option>20 km</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profile.primary_service_area" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    Primary Service Area
                  </Label>
                  <Input 
                    id="profile.primary_service_area"
                    name="profile.primary_service_area"
                    placeholder="e.g., Thamel, Kathmandu"
                    value={formData.profile.primary_service_area}
                    onChange={handleInputChange}
                    className="transition-all duration-300 hover:border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 rounded-lg"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-amber-500" />
                      Show Service Area on Profile
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display your service area to potential clients
                    </p>
                  </div>
                  <Switch 
                    checked={formData.profile.show_service_area}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        profile: {
                          ...prev.profile,
                          show_service_area: checked
                        }
                      }))
                    }
                    className="data-[state=checked]:bg-amber-500 transition-all duration-300"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  Availability
                </CardTitle>
                <CardDescription>
                  Set your booking availability and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-500" />
                      Auto Accept Bookings
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically accept bookings that match your availability
                    </p>
                  </div>
                  <Switch 
                    checked={formData.profile.auto_accept_bookings}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        profile: {
                          ...prev.profile,
                          auto_accept_bookings: checked
                        }
                      }))
                    }
                    className="data-[state=checked]:bg-cyan-500 transition-all duration-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profile.min_booking_notice" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-500" />
                    Minimum Booking Notice
                  </Label>
                  <select 
                    id="profile.min_booking_notice"
                    name="profile.min_booking_notice"
                    className="w-full h-10 px-3 border transition-all duration-300 hover:border-cyan-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 rounded-lg"
                    value={formData.profile.min_booking_notice}
                    onChange={handleInputChange}
                  >
                    <option>2 hours</option>
                    <option>4 hours</option>
                    <option>6 hours</option>
                    <option>12 hours</option>
                    <option>24 hours</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profile.max_daily_bookings" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-cyan-500" />
                    Maximum Daily Bookings
                  </Label>
                  <Input 
                    id="profile.max_daily_bookings"
                    name="profile.max_daily_bookings"
                    type="number" 
                    value={formData.profile.max_daily_bookings}
                    onChange={handleInputChange}
                    min="1" 
                    max="10" 
                    className="transition-all duration-300 hover:border-cyan-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Service Customization
                </CardTitle>
                <CardDescription>
                  Configure default settings for your services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="profile.default_service_duration" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    Default Service Duration
                  </Label>
                  <select 
                    id="profile.default_service_duration"
                    name="profile.default_service_duration"
                    className="w-full h-10 px-3 border transition-all duration-300 hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 rounded-lg"
                    value={formData.profile.default_service_duration}
                    onChange={handleInputChange}
                  >
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>3 hours</option>
                    <option>4 hours</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Reset to default values
                      setFormData(prev => ({
                        ...prev,
                        profile: {
                          ...prev.profile,
                          service_radius: "10 km",
                          primary_service_area: "",
                          show_service_area: true,
                          auto_accept_bookings: false,
                          min_booking_notice: "2 hours",
                          max_daily_bookings: 5,
                          default_service_duration: "2 hours"
                        }
                      }))
                    }}
                    disabled={preferencesSaving || preferencesLoading}
                    className="hover:shadow-md transition-all duration-300 rounded-lg group"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                    Reset
                  </Button>
                  <Button 
                    onClick={handleSaveServicePreferences} 
                    disabled={preferencesSaving || preferencesLoading}
                    className="min-w-[140px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  >
                    {preferencesSaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2"/>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2"/>
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}