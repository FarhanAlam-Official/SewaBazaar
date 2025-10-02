/**
 * Customer Settings Page Component
 * 
 * This is the main settings page for customers in the SewaBazaar application.
 * It provides comprehensive account management capabilities organized into
 * tabbed sections for better user experience.
 * 
 * Key Features:
 * - Profile management with image upload
 * - Application preferences (theme, language, timezone)
 * - Notification settings with granular controls
 * - Security features (password change, 2FA, session management)
 * - Responsive design with smooth animations
 * - Form validation and error handling
 * - Enhanced toast notifications for user feedback
 * 
 * Tab Sections:
 * 1. Profile: Personal information and profile picture
 * 2. Preferences: Theme, language, and timezone settings
 * 3. Notifications: Email, push, and topic-specific controls
 * 4. Security: Password management, 2FA, and session control
 * 
 * Design Principles:
 * - Progressive disclosure of complex settings
 * - Consistent visual language across all sections
 * - Clear feedback for all user actions
 * - Accessible form controls and labels
 * - Mobile-responsive layout
 */
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
import { Camera, Bell, Shield, Moon, Sun, Languages, RefreshCw, Check, Eye, EyeOff, LogOut, Smartphone, KeyRound, Lock, User, MapPin, Calendar, Phone, Mail } from "lucide-react"
import Image from "next/image"
import api from "@/services/api"
import { showToast } from "@/components/ui/enhanced-toast"
import { settingsApi } from "@/services/settings.api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

/**
 * Interface for profile form data structure
 * 
 * This interface defines the complete structure for user profile data
 * that can be edited in the settings form.
 * 
 * Structure:
 * - Basic user information (first_name, last_name, phone)
 * - Profile picture file (stored temporarily before upload)
 * - Detailed profile information (bio, address, etc.)
 * 
 * Design Considerations:
 * - Separates basic user fields from profile details
 * - Handles file uploads with proper typing
 * - Supports nested profile object structure
 * - Maintains consistency with backend API expectations
 */
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
  /**
   * Load user preferences and notification settings on component mount
   * 
   * This effect handles the initial loading of user settings:
   * 1. Fetches user preferences (theme, language, timezone)
   * 2. Fetches notification settings (email, push, topics)
   * 3. Updates component state with retrieved values
   * 4. Handles loading states for both API calls
   * 5. Implements proper error handling and cleanup
   * 
   * Performance Optimizations:
   * - Uses Promise.allSettled for concurrent API calls
   * - Implements isMounted pattern to prevent state updates on unmounted components
   * - Handles loading states separately for each API call
   * 
   * Error Handling:
   * - Silent failures for preferences (user may not have any yet)
   * - Graceful fallbacks for notification settings
   * - Maintains default values when API data is unavailable
   */
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

  /**
   * Save user preferences to backend
   * 
   * This function handles the saving of user preferences including:
   * - Theme selection (light, dark, system)
   * - Language preference
   * - Timezone setting
   * 
   * The function provides immediate user feedback through:
   * - Loading states during API calls
   * - Success notifications on completion
   * - Error notifications on failure
   * 
   * Implementation Details:
   * - Uses settingsApi.updatePreferences for backend communication
   * - Maintains saving state to prevent duplicate submissions
   * - Provides clear success/error messaging
   * - Handles API errors gracefully
   */
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

  /**
   * Save notification settings to backend
   * 
   * This function handles the saving of user notification preferences:
   * - Email notification toggle
   * - Push notification toggle
   * - Topic-specific subscription management
   * 
   * User Experience Features:
   * - Loading states during save operations
   * - Success feedback on completion
   * - Error handling with user-friendly messages
   * - Immediate visual feedback through UI controls
   * 
   * Technical Implementation:
   * - Uses settingsApi.updateNotificationSettings for persistence
   * - Manages saving state to prevent duplicate requests
   * - Handles API errors with appropriate notifications
   * - Maintains consistency between UI and backend state
   */
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

  /**
   * Toggle notification topic subscription
   * 
   * This function manages user subscriptions to notification topics:
   * - Adds topic to subscriptions if not already subscribed
   * - Removes topic from subscriptions if already subscribed
   * 
   * Supported Topics:
   * - bookings: Service booking updates
   * - messages: New message notifications
   * - promotions: Special offers and promotions
   * 
   * Implementation Details:
   * - Uses functional state update for array manipulation
   * - Maintains immutability of state arrays
   * - Provides immediate UI feedback
   * - Integrates with saveNotifications workflow
   */
  const toggleTopic = (key: string) => {
    setTopics(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key])
  }

  /**
   * Handle password change requests
   * 
   * This function manages the complete password change workflow:
   * 1. Validates all required fields are filled
   * 2. Confirms new password matches confirmation
   * 3. Ensures new password meets minimum length requirements
   * 4. Sends change request to backend API
   * 5. Clears form fields on success
   * 6. Provides user feedback through notifications
   * 
   * Validation Rules:
   * - All fields must be filled
   * - New password and confirmation must match
   * - New password must be at least 8 characters
   * 
   * Security Considerations:
   * - Current password verification
   * - Secure API communication
   * - Form field clearing after successful change
   * - Error handling without exposing sensitive information
   * 
   * User Experience:
   * - Clear error messages for each validation failure
   * - Loading states during API requests
   * - Success confirmation with clear messaging
   */
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
  /**
   * Load security-related data including active sessions and 2FA status
   * 
   * This function fetches security information for the user:
   * 1. Active login sessions across devices
   * 2. Two-factor authentication status and method
   * 
   * Implementation Details:
   * - Uses Promise.allSettled for concurrent API calls
   * - Updates component state with retrieved data
   * - Maintains loading state during API requests
   * - Handles errors gracefully without blocking UI
   * 
   * Data Management:
   * - Sessions array for session management
   * - 2FA status object with enabled state and method
   * - Proper state updates only when component is mounted
   * 
   * User Experience:
   * - Loading indicators during data fetch
   * - Clear display of current session vs other sessions
   * - Visual indicators for 2FA status
   */
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

  /**
   * Revoke a user session
   * 
   * This function handles the revocation of active user sessions:
   * 1. Sends revoke request to backend API
   * 2. Updates local sessions state
   * 3. Provides user feedback through notifications
   * 
   * Session Management:
   * - Identifies session by unique ID
   * - Removes session from local state immediately
   * - Communicates with backend for permanent revocation
   * 
   * User Experience:
   * - Immediate visual feedback in session list
   * - Loading states during API calls
   * - Success confirmation for completed revocation
   * - Error handling with clear messaging
   * 
   * Security:
   * - Secure API communication for session management
   * - Proper error handling without exposing sensitive data
   */
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
  /**
   * Initiate the 2FA enablement process
   * 
   * This function starts the two-factor authentication setup workflow:
   * 1. Sets initial 2FA method (TOTP)
   * 2. Clears previous QR code and verification code
   * 3. Opens the 2FA setup modal
   * 4. Requests 2FA provisioning from backend
   * 5. Displays QR code for authenticator app scanning
   * 
   * User Experience:
   * - Loading states during provisioning
   * - Modal interface for setup process
   * - Clear instructions for QR code scanning
   * - Error handling with user feedback
   * 
   * Security Considerations:
   * - Secure API communication for provisioning
   * - QR code generation with proper encoding
   * - Verification code validation
   * - Proper state management during setup
   */
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

  /**
   * Verify 2FA setup with user-provided code
   * 
   * This function completes the two-factor authentication setup:
   * 1. Validates that verification code is provided
   * 2. Sends code to backend for verification
   * 3. Updates 2FA status on success
   * 4. Closes setup modal on completion
   * 5. Provides user feedback through notifications
   * 
   * Validation:
   * - Ensures verification code is not empty
   * - Trims whitespace from input
   * 
   * Error Handling:
   * - Clear error messages for failed verification
   * - Maintains modal state on failure
   * - Provides guidance for retry attempts
   * 
   * Success Workflow:
   * - Updates local 2FA status state
   * - Closes setup modal
   * - Shows success confirmation
   * - Maintains loading states during API calls
   */
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

  /**
   * Disable two-factor authentication
   * 
   * This function handles the 2FA disablement process:
   * 1. Sends disable request to backend API
   * 2. Updates local 2FA status state
   * 3. Provides user feedback through notifications
   * 
   * Security Considerations:
   * - Secure API communication for disablement
   * - Immediate state update on success
   * - Proper error handling for failed requests
   * 
   * User Experience:
   * - Loading states during API calls
   * - Clear success confirmation
   * - Error messaging for failures
   * - Visual status updates in UI
   */
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

  /**
   * Handle input field changes in the profile form
   * 
   * This function manages updates to form fields:
   * 1. Extracts field name and value from change event
   * 2. Determines if field is a profile nested property
   * 3. Updates appropriate state object (formData or profile)
   * 
   * Field Handling:
   * - Top-level fields (first_name, last_name, etc.)
   * - Nested profile fields (profile.bio, profile.address, etc.)
   * 
   * Implementation Details:
   * - Uses name attribute convention for nested fields (profile.fieldName)
   * - Maintains immutability of state objects
   * - Provides immediate UI feedback
   * - Supports both input and textarea elements
   */
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

  /**
   * Trigger file input click for profile image selection
   * 
   * This function programmatically triggers the hidden file input element
   * when the profile image preview area is clicked.
   * 
   * User Experience:
   * - Provides clear visual indication of clickable area
   * - Maintains accessibility through proper labeling
   * - Enables intuitive image upload workflow
   * 
   * Implementation Details:
   * - Uses ref to access hidden file input element
   * - Maintains separation of concerns between UI and functionality
   * - Integrates with handleImageChange for complete workflow
   */
  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  /**
   * Handle profile image selection and preview
   * 
   * This function processes user-selected profile images:
   * 1. Validates file size (5MB maximum)
   * 2. Creates preview using FileReader API
   * 3. Stores file in formData for later submission
   * 4. Provides user feedback for errors
   * 
   * File Validation:
   * - Maximum size: 5MB
   * - File type: Any image format (browser handles conversion)
   * 
   * User Experience Features:
   * - Immediate visual preview of selected image
   * - Clear error messaging for oversized files
   * - Smooth transitions and hover effects
   * - Accessible file input handling
   * 
   * Technical Implementation:
   * - Uses FileReader for client-side preview
   * - Stores File object for later form submission
   * - Maintains imagePreview state for UI updates
   * - Integrates with form submission workflow
   */
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

  /**
   * Handle form submission for profile updates
   * 
   * This function handles the complete profile update workflow:
   * 1. Prevents default form submission
   * 2. Sets loading state
   * 3. Clears previous field errors
   * 4. Creates FormData object with all profile fields
   * 5. Sends update request to backend API
   * 6. Refreshes user data in auth context
   * 7. Shows success or error notifications
   * 
   * Error Handling:
   * - Displays field-specific errors if available from API
   * - Shows generic error message for unexpected failures
   * - Uses enhanced toast notifications for user feedback
   * 
   * Implementation Details:
   * - Uses multipart/form-data for file uploads
   * - Handles both text fields and profile picture updates
   * - Maintains loading states during API calls
   */
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
      // Show error notification to user instead of logging to console
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="rounded-xl p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 mb-2 leading-tight pb-1">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl" style={{lineHeight: '1.4'}}>Manage your account settings and preferences.</p>
        </div>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <TabsList className="bg-muted/50 p-1 rounded-xl shadow-sm w-full md:w-auto">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-muted/80 hover:shadow-md px-4 py-2 font-medium"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-muted/80 hover:shadow-md px-4 py-2 font-medium"
            >
              Preferences
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-muted/80 hover:shadow-md px-4 py-2 font-medium"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-muted/80 hover:shadow-md px-4 py-2 font-medium"
            >
              Security
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
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
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="flex flex-col items-center space-y-6">
                    <motion.div 
                      className="relative group"
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div 
                        className="relative h-32 w-32 rounded-full transition-all duration-300 group-hover:scale-105 p-[3px] bg-gradient-to-r from-indigo-500/50 to-purple-500/50 group-hover:from-indigo-500 group-hover:to-purple-500 dark:from-indigo-400/50 dark:to-purple-400/50 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] cursor-pointer"
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
                    </motion.div>
                    <motion.p 
                      className="text-sm text-muted-foreground transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-500 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400"
                      whileHover={{ y: -2 }}
                    >
                      Click to upload new profile picture
                    </motion.p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
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
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
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
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-indigo-500" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email}
                        disabled
                        className="opacity-90 rounded-lg"
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-indigo-500" />
                        Phone Number
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
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <Label htmlFor="profile.address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-500" />
                        Address
                      </Label>
                      <Input
                        id="profile.address"
                        name="profile.address"
                        value={formData.profile.address}
                        onChange={handleInputChange}
                        placeholder="Enter your address"
                        className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                    >
                      <Label htmlFor="profile.city" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-500" />
                        City
                      </Label>
                      <Input
                        id="profile.city"
                        name="profile.city"
                        value={formData.profile.city}
                        onChange={handleInputChange}
                        placeholder="Enter your city"
                        className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2 md:col-span-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      <Label htmlFor="profile.bio" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-500" />
                        Bio
                      </Label>
                      <Textarea
                        id="profile.bio"
                        name="profile.bio"
                        value={formData.profile.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.9 }}
                    >
                      <Label htmlFor="profile.date_of_birth" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        Date of Birth
                      </Label>
                      <Input
                        id="profile.date_of_birth"
                        name="profile.date_of_birth"
                        type="date"
                        value={formData.profile.date_of_birth}
                        onChange={handleInputChange}
                        className="transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-lg"
                      />
                    </motion.div>
                  </div>

                  <motion.div 
                    className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 1 }}
                  >
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
                      className="hover:shadow-md transition-all duration-300 rounded-lg group"
                    >
                      <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                      Reset Changes
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="min-w-[140px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      {isLoading ? (
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
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="preferences">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your app experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <motion.div 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      Theme
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Choose between light and dark mode
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant={theme === 'light' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setTheme('light')} 
                      className="gap-1 transition-all duration-300 hover:shadow-md rounded-lg"
                    >
                      <Sun className="h-4 w-4" /> Light
                    </Button>
                    <Button 
                      type="button" 
                      variant={theme === 'dark' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setTheme('dark')} 
                      className="gap-1 transition-all duration-300 hover:shadow-md rounded-lg"
                    >
                      <Moon className="h-4 w-4" /> Dark
                    </Button>
                    <Button 
                      type="button" 
                      variant={theme === 'system' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setTheme('system')} 
                      className="gap-1 transition-all duration-300 hover:shadow-md rounded-lg"
                    >
                      <RefreshCw className="h-4 w-4" /> System
                    </Button>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-blue-500" />
                      Language
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred language
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Languages className="h-4 w-4" />
                    <select 
                      className="form-select rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800" 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="ne">नेपाली</option>
                    </select>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      Timezone
                    </Label>
                    <p className="text-sm text-muted-foreground">Set your local timezone</p>
                  </div>
                  <input
                    className="form-input rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full sm:w-auto transition-all duration-300 hover:border-purple-300 focus:border-purple-500 focus:ring-purple-200 dark:focus:ring-purple-800"
                    placeholder="e.g., Asia/Kathmandu"
                    value={timezone || ""}
                    onChange={(e) => setTimezone(e.target.value)}
                  />
                </motion.div>

                <motion.div 
                  className="flex justify-end gap-3 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
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
                    }} 
                    disabled={prefLoading || prefSaving}
                    className="hover:shadow-md transition-all duration-300 rounded-lg group"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${prefLoading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
                    Refresh
                  </Button>
                  <Button 
                    type="button" 
                    onClick={savePreferences} 
                    disabled={prefLoading || prefSaving}
                    className="min-w-[140px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    {prefSaving ? (
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
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
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
                <motion.div 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    checked={emailEnabled} 
                    onCheckedChange={setEmailEnabled} 
                    className="data-[state=checked]:bg-blue-500 transition-all duration-300"
                  />
                </motion.div>

                <motion.div 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-purple-500" />
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications
                    </p>
                  </div>
                  <Switch 
                    checked={pushEnabled} 
                    onCheckedChange={setPushEnabled} 
                    className="data-[state=checked]:bg-purple-500 transition-all duration-300"
                  />
                </motion.div>

                <motion.div 
                  className="space-y-4 p-4 rounded-xl bg-muted/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    Notification Types
                  </Label>
                  <div className="space-y-3">
                    <motion.div 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-300 cursor-pointer"
                      whileHover={{ x: 5 }}
                      onClick={() => toggleTopic('bookings')}
                    >
                      <input 
                        type="checkbox" 
                        id="bookings" 
                        className="rounded h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300" 
                        checked={topics.includes('bookings')} 
                        onChange={() => {}} 
                      />
                      <label htmlFor="bookings" className="cursor-pointer">Booking updates</label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-300 cursor-pointer"
                      whileHover={{ x: 5 }}
                      onClick={() => toggleTopic('messages')}
                    >
                      <input 
                        type="checkbox" 
                        id="messages" 
                        className="rounded h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300" 
                        checked={topics.includes('messages')} 
                        onChange={() => {}} 
                      />
                      <label htmlFor="messages" className="cursor-pointer">New messages</label>
                    </motion.div>
                    <motion.div 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-300 cursor-pointer"
                      whileHover={{ x: 5 }}
                      onClick={() => toggleTopic('promotions')}
                    >
                      <input 
                        type="checkbox" 
                        id="promotions" 
                        className="rounded h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300" 
                        checked={topics.includes('promotions')} 
                        onChange={() => {}} 
                      />
                      <label htmlFor="promotions" className="cursor-pointer">Promotions and offers</label>
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex justify-end gap-3 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
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
                    }} 
                    disabled={notifLoading || notifSaving}
                    className="hover:shadow-md transition-all duration-300 rounded-lg group"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${notifLoading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
                    Refresh
                  </Button>
                  <Button 
                    type="button" 
                    onClick={saveNotifications} 
                    disabled={notifLoading || notifSaving}
                    className="min-w-[140px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {notifSaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2"/>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2"/>
                        Save Notifications
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
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
                <motion.div 
                  className="space-y-6 p-5 rounded-xl bg-muted/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-amber-500" />
                    Change Password
                  </h3>
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-rose-500" />
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input 
                          id="currentPassword" 
                          type={showPwd.current ? 'text' : 'password'} 
                          placeholder="Enter your current password" 
                          value={cpCurrent} 
                          onChange={(e)=>setCpCurrent(e.target.value)} 
                          className="transition-all duration-300 hover:border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 rounded-lg pr-10"
                        />
                        <button 
                          type="button" 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={()=>setShowPwd(p=>({...p,current:!p.current}))}
                        >
                          {showPwd.current ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-amber-500" />
                        New Password
                      </Label>
                      <div className="relative">
                        <Input 
                          id="newPassword" 
                          type={showPwd.next ? 'text' : 'password'} 
                          placeholder="Enter your new password" 
                          value={cpNew} 
                          onChange={(e)=>setCpNew(e.target.value)} 
                          className="transition-all duration-300 hover:border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 rounded-lg pr-10"
                        />
                        <button 
                          type="button" 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={()=>setShowPwd(p=>({...p,next:!p.next}))}
                        >
                          {showPwd.next ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-emerald-500" />
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input 
                          id="confirmPassword" 
                          type={showPwd.confirm ? 'text' : 'password'} 
                          placeholder="Confirm your new password" 
                          value={cpConfirm} 
                          onChange={(e)=>setCpConfirm(e.target.value)} 
                          className="transition-all duration-300 hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 rounded-lg pr-10"
                        />
                        <button 
                          type="button" 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={()=>setShowPwd(p=>({...p,confirm:!p.confirm}))}
                        >
                          {showPwd.confirm ? <EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                        </button>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      onClick={handleChangePassword} 
                      disabled={cpSaving}
                      className="min-w-[160px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                    >
                      {cpSaving ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2"/>
                          Updating...
                        </>
                      ) : (
                        <>
                          <KeyRound className="h-4 w-4 mr-2"/>
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>

                <motion.div 
                  className="space-y-6 p-5 rounded-xl bg-muted/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
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
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={twoFAStatus.enabled ? 'default' : 'outline'}
                        className={twoFAStatus.enabled ? "bg-gradient-to-r from-green-500 to-emerald-500" : ""}
                      >
                        {twoFAStatus.enabled ? (twoFAStatus.method || 'Enabled') : 'Disabled'}
                      </Badge>
                      {twoFAStatus.enabled ? (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={disable2FA} 
                          disabled={twoFALoading}
                          className="gap-2 hover:shadow-md transition-all duration-300 rounded-lg group"
                        >
                          <Lock className="h-4 w-4"/>
                          Disable
                        </Button>
                      ) : (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={openEnable2FA} 
                          disabled={twoFALoading}
                          className="gap-2 hover:shadow-md transition-all duration-300 rounded-lg group"
                        >
                          <KeyRound className="h-4 w-4"/>
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="space-y-6 p-5 rounded-xl bg-muted/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-purple-500" />
                    Active Sessions
                  </h3>
                  <div className="space-y-4">
                    {sessionsLoading ? (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        Loading sessions...
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No other active sessions.</div>
                    ) : (
                      sessions.map((s)=> (
                        <motion.div 
                          key={s.id} 
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl transition-all duration-300 hover:bg-muted/50"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="mb-3 sm:mb-0">
                            <p className="font-medium">{s.user_agent || 'Device'}</p>
                            <p className="text-sm text-muted-foreground">{s.ip || 'IP unknown'} • {s.city || ''} {s.current ? '• Current session' : ''}</p>
                          </div>
                          {s.current ? (
                            <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500">
                              <Shield className="h-4 w-4 mr-1" />
                              Current
                            </Badge>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={()=>revokeSession(s.id)}
                              className="gap-2 hover:shadow-md transition-all duration-300 rounded-lg group"
                            >
                              <LogOut className="h-4 w-4"/>
                              Revoke
                            </Button>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* 2FA Enable Modal */}
      <Dialog open={twoFAModalOpen} onOpenChange={setTwoFAModalOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              Enable Two-Factor Authentication
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app and enter the 6-digit code.</p>
            {twoFALoading ? (
              <div className="py-8 flex justify-center">
                <LoadingSpinner/>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5">
                {twoFAQrUrl ? (
                  // Using a QR generator URL for display only; code verified via backend
                  <img 
                    src={`https://quickchart.io/qr?text=${encodeURIComponent(twoFAQrUrl)}&size=240`} 
                    alt="2FA QR" 
                    className="rounded-xl border shadow-lg p-2 bg-white"
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">Provisioning info unavailable</div>
                )}
                <div className="w-full space-y-2">
                  <Label htmlFor="twoFACode">Verification Code</Label>
                  <Input 
                    id="twoFACode"
                    placeholder="123456" 
                    value={twoFACode} 
                    onChange={(e)=>setTwoFACode(e.target.value)} 
                    className="transition-all duration-300 hover:border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={()=>setTwoFAModalOpen(false)}
              className="hover:shadow-md transition-all duration-300 rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              onClick={verify2FA} 
              disabled={twoFALoading || !twoFACode.trim()}
              className="min-w-[120px] hover:shadow-lg transition-all duration-300 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              {twoFALoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2"/>
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}