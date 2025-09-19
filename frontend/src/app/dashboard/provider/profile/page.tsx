"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Image from "next/image"
import { 
  Camera, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Upload, 
  X, 
  Plus,
  Edit2,
  Trash2,
  Award,
  Calendar,
  Briefcase,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Settings,
  Lock,
  Bell
} from "lucide-react"
import { useProviderProfile } from '@/hooks/useProviderProfile'
import Link from 'next/link'

interface ProfileFormData {
  first_name: string
  last_name: string
  phone: string
  bio: string
  address: string
  city: string
  company_name: string
  display_name: string
  years_of_experience: string
  location_city: string
}

export default function ProviderProfile() {
  const { toast } = useToast()
  const {
    profileData,
    portfolioMedia,
    loading,
    error,
    updateProfile,
    uploadProfilePicture,
    uploadPortfolioMedia,
    deletePortfolioMedia,
    refreshProfile
  } = useProviderProfile()

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    address: '',
    city: '',
    company_name: '',
    display_name: '',
    years_of_experience: '',
    location_city: ''
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [certifications, setCertifications] = useState<string[]>([])
  const [newCertification, setNewCertification] = useState('')
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false)
  const [portfolioTitle, setPortfolioTitle] = useState('')
  const [portfolioDescription, setPortfolioDescription] = useState('')

  const profilePictureRef = useRef<HTMLInputElement>(null)
  const portfolioFileRef = useRef<HTMLInputElement>(null)

  // Initialize form data when profile loads
  useEffect(() => {
    if (profileData) {
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone: profileData.phone || '',
        bio: profileData.profile?.bio || '',
        address: profileData.profile?.address || '',
        city: profileData.profile?.city || '',
        company_name: profileData.profile?.company_name || '',
        display_name: profileData.profile?.display_name || '',
        years_of_experience: profileData.profile?.years_of_experience?.toString() || '0',
        location_city: profileData.profile?.location_city || ''
      })
      setCertifications(profileData.profile?.certifications || [])
    }
  }, [profileData])

  // Handle form input changes
  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await uploadProfilePicture(file)
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully"
      })
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive"
      })
    }
  }

  // Handle profile form submission
  const handleSubmitProfile = async () => {
    try {
      setIsSubmitting(true)
      
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        profile: {
          bio: formData.bio,
          address: formData.address,
          city: formData.city,
          company_name: formData.company_name,
          display_name: formData.display_name,
          years_of_experience: parseInt(formData.years_of_experience) || 0,
          location_city: formData.location_city,
          certifications
        }
      }

      await updateProfile(updateData)
      setIsEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle certification management
  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications(prev => [...prev, newCertification.trim()])
      setNewCertification('')
    }
  }

  const removeCertification = (cert: string) => {
    setCertifications(prev => prev.filter(c => c !== cert))
  }

  // Handle portfolio media upload
  const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await uploadPortfolioMedia(file, portfolioTitle, portfolioDescription)
      setPortfolioDialogOpen(false)
      setPortfolioTitle('')
      setPortfolioDescription('')
      toast({
        title: "Portfolio Media Added",
        description: "Your portfolio media has been uploaded successfully"
      })
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload portfolio media",
        variant: "destructive"
      })
    }
  }

  // Handle portfolio media deletion
  const handleDeletePortfolioMedia = async (mediaId: number) => {
    try {
      await deletePortfolioMedia(mediaId)
      toast({
        title: "Media Deleted",
        description: "Portfolio media has been deleted successfully"
      })
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete portfolio media",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={refreshProfile}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No profile data available</p>
          <Button onClick={refreshProfile} className="mt-4">Refresh</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitProfile} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="relative">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <Image
                  src={profileData.profile_picture || "/placeholder-user.jpg"}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="rounded-full object-cover w-full h-full"
                />
                {isEditing && (
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full"
                    variant="secondary"
                    onClick={() => profilePictureRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
                <input
                  ref={profilePictureRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                />
              </div>
              
              <h2 className="text-xl font-bold text-center">
                {profileData.profile?.display_name || `${profileData.first_name} ${profileData.last_name}`}
              </h2>
              <p className="text-center text-muted-foreground mb-4">
                {profileData.profile?.company_name || 'Service Provider'}
              </p>
              
              <div className="flex items-center justify-center gap-1 mb-4">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{profileData.profile?.avg_rating || '0.0'}</span>
                <span className="text-muted-foreground">
                  ({profileData.profile?.reviews_count || 0} reviews)
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{profileData.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{profileData.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {profileData.profile?.location_city || profileData.profile?.city || 'Location not set'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {profileData.profile?.years_of_experience || 0} years of experience
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Verification Status</span>
                  {profileData.is_verified ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Verified Provider</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Pending Verification</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Account Settings Navigation */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
            <div className="space-y-2">
              <Link href="/dashboard/provider/settings" className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                <Settings className="h-4 w-4" />
                <span>General Settings</span>
              </Link>
              <Link href="/dashboard/provider/settings/privacy" className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                <Shield className="h-4 w-4" />
                <span>Privacy Settings</span>
              </Link>
              <Link href="/dashboard/provider/settings/notifications" className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                <Bell className="h-4 w-4" />
                <span>Notification Settings</span>
              </Link>
              <Link href="/dashboard/provider/settings/password" className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                <Lock className="h-4 w-4" />
                <span>Change Password</span>
              </Link>
            </div>
          </Card>
        </div>
        
        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_of_experience">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  value={formData.years_of_experience}
                  onChange={(e) => handleInputChange('years_of_experience', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Tell customers about yourself and your experience..."
                />
              </div>
            </div>
          </Card>
          
          {/* Business Information */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Name shown to customers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Full address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location_city">Service Location</Label>
                <Input
                  id="location_city"
                  value={formData.location_city}
                  onChange={(e) => handleInputChange('location_city', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., Kathmandu"
                />
              </div>
            </div>
          </Card>
          
          {/* Certifications & Qualifications */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Certifications & Qualifications</h3>
            {isEditing && (
              <div className="flex gap-2 mb-4">
                <Input
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  placeholder="Add a certification"
                  onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                />
                <Button onClick={addCertification} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            {certifications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center">
                    <Award className="h-3 w-3 mr-1" />
                    {cert}
                    {isEditing && (
                      <button
                        onClick={() => removeCertification(cert)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {isEditing ? "No certifications added yet" : "No certifications listed"}
              </p>
            )}
          </Card>
          
          {/* Portfolio */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Portfolio</h3>
              {isEditing && (
                <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Media
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Portfolio Media</DialogTitle>
                      <DialogDescription>
                        Upload images or videos to showcase your work
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="portfolio_title">Title (Optional)</Label>
                        <Input
                          id="portfolio_title"
                          value={portfolioTitle}
                          onChange={(e) => setPortfolioTitle(e.target.value)}
                          placeholder="e.g., Living Room Cleaning"
                        />
                      </div>
                      <div>
                        <Label htmlFor="portfolio_description">Description (Optional)</Label>
                        <Textarea
                          id="portfolio_description"
                          value={portfolioDescription}
                          onChange={(e) => setPortfolioDescription(e.target.value)}
                          placeholder="Describe your work..."
                        />
                      </div>
                      <div>
                        <Label>Select File</Label>
                        <div className="mt-2 border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Click to upload images or videos</p>
                          <p className="text-xs text-muted-foreground mt-1">Max file size: 5MB</p>
                          <input
                            ref={portfolioFileRef}
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handlePortfolioUpload}
                          />
                          <Button
                            variant="outline"
                            className="mt-2"
                            onClick={() => portfolioFileRef.current?.click()}
                          >
                            Select File
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPortfolioDialogOpen(false)}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {portfolioMedia.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioMedia.map((media) => (
                  <div key={media.id} className="relative group">
                    {media.media_type === 'image' ? (
                      <Image
                        src={media.file}
                        alt={media.title || 'Portfolio item'}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover rounded-lg aspect-square"
                      />
                    ) : (
                      <video
                        src={media.file}
                        className="w-full h-full object-cover rounded-lg aspect-square"
                        controls={false}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <div className="flex gap-2">
                        {isEditing && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Portfolio Media</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this portfolio item? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeletePortfolioMedia(media.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    {media.title && (
                      <p className="mt-2 text-sm font-medium">{media.title}</p>
                    )}
                    {media.description && (
                      <p className="text-xs text-muted-foreground mt-1">{media.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Image 
                  src="/placeholder-image.jpg" 
                  alt="No portfolio items" 
                  width={48} 
                  height={48} 
                  className="h-12 w-12 text-muted-foreground mx-auto mb-2" 
                />
                <p className="text-muted-foreground">No portfolio items yet</p>
                {isEditing && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Add images or videos to showcase your work
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}