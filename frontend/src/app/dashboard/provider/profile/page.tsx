"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { showToast } from "@/components/ui/enhanced-toast"
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
import { motion } from "framer-motion"
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
  Bell,
  Users,
  TrendingUp,
  Target,
  BookOpen,
  BarChart3,
  Share2,
  Download,
  QrCode,
  Copy,
  ExternalLink,
  Image as ImageIconComponent
} from "lucide-react"
import { useProviderProfile } from '@/hooks/useProviderProfile'
import Link from 'next/link'
import { Skeleton } from "@/components/ui/skeleton"

// Animation variants for smooth page transitions
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

// Animation variants for individual cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

// Mock data for provider analytics (in a real app, this would come from APIs)
interface ProviderProfileData {
  personalInsights: {
    serviceExpertise: {
      primaryCategory: string
      yearsOfExperience: number
      servicesProvided: number
      averageResponseTime: number // in hours
    }
    businessAnalytics: {
      monthlyRevenue: number
      completedBookings: number
      customerRetention: number // percentage
      peakBookingDays: string[]
    }
    performanceMetrics: {
      avgRating: number
      totalReviews: number
      onTimeCompletion: number // percentage
      cancellationRate: number // percentage
    }
  }
  achievements: {
    id: string
    title: string
    description: string
    icon: string
    unlockedAt: string
    category: 'service' | 'revenue' | 'customer' | 'milestone'
    points: number
    progress?: {
      current: number
      total: number
    }
  }[]
  milestones: {
    id: string
    title: string
    description: string
    target: number
    current: number
    category: 'bookings' | 'revenue' | 'reviews' | 'services'
    reward?: string
  }[]
  recommendations: {
    serviceImprovements: {
      id: string
      suggestion: string
      potentialImpact: 'low' | 'medium' | 'high'
      category: string
    }[]
    businessTips: {
      id: string
      tip: string
      potentialEarnings: number
      category: string
    }[]
  }
  sharing: {
    profileUrl: string
    qrCode: string
    shareableLinks: {
      platform: string
      url: string
      icon: string
    }[]
  }
}

export default function ProviderProfile() {
  const router = useRouter()
  const {
    profileData,
    portfolioMedia,
    error,
    refreshProfile
  } = useProviderProfile()

  const [activeTab, setActiveTab] = useState("overview")
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrImageDataUrl, setQrImageDataUrl] = useState<string>("")
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)

  // Resolve absolute image URL for profile pictures returned as relative paths
  const getImageUrl = useCallback((url?: string) => {
    if (!url) return '/placeholder-user.jpg'
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    if (url.startsWith('/')) return `${backendBase}${url}`
    return `${backendBase}/media/${url}`
  }, [])

  // Mock provider profile data (in a real app, this would come from APIs)
  const [providerProfileData, setProviderProfileData] = useState<ProviderProfileData>({
    personalInsights: {
      serviceExpertise: {
        primaryCategory: "Home Services",
        yearsOfExperience: 5,
        servicesProvided: 15,
        averageResponseTime: 2.5
      },
      businessAnalytics: {
        monthlyRevenue: 45000,
        completedBookings: 28,
        customerRetention: 85,
        peakBookingDays: ["Saturday", "Sunday", "Monday"]
      },
      performanceMetrics: {
        avgRating: 4.8,
        totalReviews: 42,
        onTimeCompletion: 96,
        cancellationRate: 3
      }
    },
    achievements: [
      {
        id: '1',
        title: 'Service Expert',
        description: 'Completed 100+ services',
        icon: 'star',
        unlockedAt: new Date().toISOString(),
        category: 'service',
        points: 100
      },
      {
        id: '2',
        title: 'Top Earner',
        description: 'Earned ₹100,000+ in revenue',
        icon: 'trending-up',
        unlockedAt: new Date().toISOString(),
        category: 'revenue',
        points: 150
      },
      {
        id: '3',
        title: 'Customer Favorite',
        description: 'Maintained 4.5+ rating',
        icon: 'heart',
        unlockedAt: new Date().toISOString(),
        category: 'customer',
        points: 75
      },
      {
        id: '4',
        title: 'Reliable Provider',
        description: '95% on-time completion rate',
        icon: 'check-circle',
        unlockedAt: new Date().toISOString(),
        category: 'milestone',
        points: 50,
        progress: {
          current: 96,
          total: 100
        }
      }
    ],
    milestones: [
      {
        id: '1',
        title: 'Service Master',
        description: 'Complete 200 services',
        target: 200,
        current: 125,
        category: 'bookings',
        reward: 'Featured provider badge'
      },
      {
        id: '2',
        title: 'Revenue Champion',
        description: 'Earn ₹500,000 in total',
        target: 500000,
        current: 275000,
        category: 'revenue',
        reward: 'Premium support access'
      },
      {
        id: '3',
        title: 'Review Excellence',
        description: 'Receive 100 positive reviews',
        target: 100,
        current: 42,
        category: 'reviews',
        reward: 'Marketing promotion'
      }
    ],
    recommendations: {
      serviceImprovements: [
        {
          id: '1',
          suggestion: 'Add more service photos to your portfolio',
          potentialImpact: 'high',
          category: 'Portfolio'
        },
        {
          id: '2',
          suggestion: 'Update your service descriptions with more details',
          potentialImpact: 'medium',
          category: 'Services'
        }
      ],
      businessTips: [
        {
          id: '1',
          tip: 'Offer weekend discounts to increase bookings',
          potentialEarnings: 5000,
          category: 'Pricing'
        },
        {
          id: '2',
          tip: 'Respond to customer inquiries within 1 hour',
          potentialEarnings: 3000,
          category: 'Customer Service'
        }
      ]
    },
    sharing: {
      profileUrl: `${process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/provider/${profileData?.id}` || '',
      qrCode: '',
      shareableLinks: [
        {
          platform: 'WhatsApp',
          url: `https://wa.me/?text=${encodeURIComponent('Check out this provider profile on SewaBazaar: ' + (process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')) + `/provider/${profileData?.id}`)}`,
          icon: 'whatsapp'
        },
        {
          platform: 'Facebook',
          url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent((process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')) + `/provider/${profileData?.id}`)}`,
          icon: 'facebook'
        },
        {
          platform: 'Twitter',
          url: `https://twitter.com/intent/tweet?url=${encodeURIComponent((process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')) + `/provider/${profileData?.id}`)}`,
          icon: 'twitter'
        }
      ]
    }
  })

  const profilePictureRef = useRef<HTMLInputElement>(null)
  const portfolioFileRef = useRef<HTMLInputElement>(null)

  // Update sharing data when profile loads
  useEffect(() => {
    if (profileData) {
      const appBaseUrl = (process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')) as string
      const profileUrl = `${appBaseUrl.replace(/\/$/, '')}/provider/${profileData.id}`
      
      setProviderProfileData(prev => ({
        ...prev,
        sharing: {
          profileUrl,
          qrCode: '',
          shareableLinks: [
            {
              platform: 'WhatsApp',
              url: `https://wa.me/?text=${encodeURIComponent('Check out this provider profile on SewaBazaar: ' + profileUrl)}`,
              icon: 'whatsapp'
            },
            {
              platform: 'Facebook',
              url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
              icon: 'facebook'
            },
            {
              platform: 'Twitter',
              url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}`,
              icon: 'twitter'
            }
          ]
        }
      }))
    }
  }, [profileData])

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // This function is no longer used since we're redirecting to settings page for editing
    console.log('Profile picture upload is handled in settings page');
  }

  // Handle portfolio media deletion
  const handleDeletePortfolioMedia = async (mediaId: number) => {
    // This function is no longer used since we're redirecting to settings page for editing
    console.log('Portfolio media deletion is handled in settings page');
  }

  // Achievement Badge Component
  const AchievementBadge = ({ achievement }: { achievement: ProviderProfileData['achievements'][0] }) => {
    const categoryColors = {
      service: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600',
      revenue: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600',
      customer: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-600',
      milestone: 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600'
    }

    const getIcon = (icon: string) => {
      switch (icon) {
        case 'star': return <Star className="h-4 w-4" />
        case 'trending-up': return <TrendingUp className="h-4 w-4" />
        case 'heart': return <Award className="h-4 w-4" />
        case 'check-circle': return <CheckCircle className="h-4 w-4" />
        default: return <Award className="h-4 w-4" />
      }
    }

    return (
      <motion.div
        whileHover={{ scale: 1.05, y: -2 }}
        className="relative group cursor-pointer"
      >
        <Card className={`p-4 hover:shadow-xl transition-all duration-300 border-2 ${categoryColors[achievement.category]}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${categoryColors[achievement.category]} shadow-lg`}>
              {getIcon(achievement.icon)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{achievement.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  +{achievement.points} pts
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
              {achievement.progress && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{achievement.progress.current}/{achievement.progress.total}</span>
                  </div>
                  <Progress 
                    value={(achievement.progress.current / achievement.progress.total) * 100} 
                    className="h-1"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  // Milestone Card Component
  const MilestoneCard = ({ milestone }: { milestone: ProviderProfileData['milestones'][0] }) => {
    const progress = (milestone.current / milestone.target) * 100
    const isCompleted = milestone.current >= milestone.target

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="group"
      >
        <Card className={`p-4 transition-all duration-300 ${
          isCompleted 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' 
            : 'hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">{milestone.title}</h4>
            </div>
            {isCompleted && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{milestone.current}/{milestone.target}</span>
            </div>
            <Progress value={progress} className="h-2" />
            {milestone.reward && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Reward: {milestone.reward}
              </p>
            )}
          </div>
        </Card>
      </motion.div>
    )
  }

  /**
   * Generate branded QR code image for profile sharing
   * Creates a visually appealing QR code with brand elements
   * 
   * This function generates a professional-looking QR code that includes:
   * - Branding elements with the SewaBazaar logo
   * - Provider profile information
   * - Social sharing capabilities
   * 
   * The function uses HTML5 Canvas to create a two-column poster layout
   * with the QR code on the left and profile details on the right.
   */
  const generateBrandedQR = useCallback(async () => {
    // Early return if profile data is not available
    if (!profileData) return;
    
    const appBaseUrl = (process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')) as string
    const profileUrl = `${appBaseUrl.replace(/\/$/, '')}/provider/${profileData.id}`
    if (!profileUrl) return
    
    try {
      setIsGeneratingQr(true)
      const canvas = document.createElement('canvas')
      // Landscape two-column poster
      const width = 1200
      const height = 800
      const dpr = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)

      // Helper: rounded rect path
      const roundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        const radius = Math.min(r, w / 2, h / 2)
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.arcTo(x + w, y, x + w, y + h, radius)
        ctx.arcTo(x + w, y + h, x, y + h, radius)
        ctx.arcTo(x, y + h, x, y, radius)
        ctx.arcTo(x, y, x + w, y, radius)
        ctx.closePath()
      }

      // Background with subtle pattern
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#ffffff')
      bgGrad.addColorStop(1, '#f8fafc')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)
      ctx.save()
      ctx.globalAlpha = 0.04
      for (let i = 0; i < 40; i++) {
        const x = 20 + (i * 40) % (width + 80)
        const y = 160 + Math.floor(i / 10) * 40
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#2563eb'
        ctx.fill()
      }
      ctx.restore()

      // Top brand header removed (no gradient background to avoid mixing with favicon)

      // Brand text & logo image
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      // Try to render favicon in a circular mask on the left
      try {
        const headerLogoImg = document.createElement('img') as HTMLImageElement
        headerLogoImg.crossOrigin = 'anonymous'
        headerLogoImg.src = '/favicon.png'
        await new Promise<void>((resolve) => {
          headerLogoImg.onload = () => resolve()
          headerLogoImg.onerror = () => resolve()
        })
        const hcx = 80
        const hcy = 84
        const hr = 32
        ctx.save()
        ctx.beginPath()
        ctx.arc(hcx, hcy, hr, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(headerLogoImg, hcx - hr, hcy - hr, hr * 2, hr * 2)
        ctx.restore()
      } catch {}
      // Title (gradient text) and subtitle
      ctx.font = 'bold 30px Inter, Arial'
      const textGradient = ctx.createLinearGradient(130, 60, 380, 100)
      textGradient.addColorStop(0, '#2563eb')
      textGradient.addColorStop(1, '#7c3aed')
      ctx.fillStyle = textGradient
      ctx.fillText('SewaBazaar', 130, 78)
      ctx.font = '16px Inter, Arial'
      ctx.fillStyle = '#0f172a'
      ctx.fillText('Scan to view my profile and connect', 130, 106)

      // Content area split into two columns
      const gap = 24
      const leftX = 40
      const leftW = (width - 80 - gap) * 0.5
      const rightX = leftX + leftW + gap
      const rightW = (width - 80 - gap) * 0.5

      // Left column (QR)
      roundedRect(leftX, 164, leftW, height - 220, 20)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 2
      ctx.stroke()

      // Load QR image
      const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(profileUrl)}&size=600&margin=0&format=png&ecLevel=M`
      const qrImg = document.createElement('img') as HTMLImageElement
      qrImg.crossOrigin = 'anonymous'
      qrImg.src = qrUrl
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve()
        qrImg.onerror = () => reject(new Error('QR image failed to load'))
      })

      // QR with white padding & shadow
      const qrSize = Math.min(leftW - 80, height - 360)
      const qrX = leftX + (leftW - qrSize) / 2
      const qrY = 220
      roundedRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 16)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.1)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 6
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
      ctx.restore()

      // QR caption
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 20px Inter, Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Scan to connect with me on SewaBazaar', leftX + leftW / 2, qrY + qrSize + 48)
      ctx.font = '14px Inter, Arial'
      ctx.fillStyle = '#475569'
      ctx.fillText(profileUrl.replace(/^https?:\/\//, ''), leftX + leftW / 2, qrY + qrSize + 72)

      // Center logo overlay on QR (circular favicon)
      const logoSize = Math.max(56, Math.min(96, qrSize * 0.16))
      const logoX = qrX + (qrSize - logoSize) / 2
      const logoY = qrY + (qrSize - logoSize) / 2
      const cx = logoX + logoSize / 2
      const cy = logoY + logoSize / 2
      // white circle background to ensure QR readability
      ctx.beginPath()
      ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      try {
        const centerLogo = document.createElement('img') as HTMLImageElement
        centerLogo.crossOrigin = 'anonymous'
        centerLogo.src = '/favicon.png'
        await new Promise<void>((resolve) => {
          centerLogo.onload = () => resolve()
          centerLogo.onerror = () => resolve()
        })
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, (logoSize / 2) - 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(centerLogo, logoX + 2, logoY + 2, logoSize - 4, logoSize - 4)
        ctx.restore()
      } catch {
        // fallback to gradient S if favicon fails
        const innerR = logoSize / 2 - 4
        const lg = ctx.createLinearGradient(logoX, logoY, logoX + logoSize, logoY + logoSize)
        lg.addColorStop(0, '#2563eb')
        lg.addColorStop(1, '#7c3aed')
        ctx.beginPath()
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
        ctx.fillStyle = lg
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold ${Math.floor(logoSize * 0.5)}px Inter, Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('S', cx, cy + 2)
      }

      // Right column (Profile details)
      roundedRect(rightX, 164, rightW, height - 220, 20)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 2
      ctx.stroke()

      // Avatar circle
      const avatarSize = 80
      const avatarX = rightX + 24
      const avatarY = 184
      // Save context before clipping
      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      try {
        const avatarImg = document.createElement('img') as HTMLImageElement
        avatarImg.crossOrigin = 'anonymous'
        avatarImg.src = profileData?.profile_picture || '/placeholder.svg'
        await new Promise<void>((resolve) => {
          avatarImg.onload = () => resolve()
          avatarImg.onerror = () => resolve() // don't fail on avatar
        })
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize)
      } catch {}
      // Restore context to remove clipping region
      ctx.restore()

      // Text details
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 22px Inter, Arial'
      ctx.textAlign = 'left'
      const fullName = `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() || 'SewaBazaar Provider'
      ctx.fillText(fullName, rightX + 24 + avatarSize + 16, 208)
      ctx.font = '16px Inter, Arial'
      if (profileData?.email) ctx.fillText(profileData.email, rightX + 24 + avatarSize + 16, 236)
      if (profileData?.phone) ctx.fillText(profileData.phone, rightX + 24 + avatarSize + 16, 262)

      // Additional profile details (category, experience, stats)
      ctx.font = 'bold 18px Inter, Arial'
      ctx.fillText('Profile Details', rightX + 24, 310)
      ctx.font = '16px Inter, Arial'
      ctx.fillStyle = '#0f172a'
      
      // Safely access providerProfileData properties with optional chaining
      if (providerProfileData.personalInsights?.serviceExpertise?.primaryCategory) {
        ctx.fillText(`Primary Category: ${providerProfileData.personalInsights.serviceExpertise.primaryCategory}`, rightX + 24, 340)
      }
      
      if (providerProfileData.personalInsights?.serviceExpertise?.yearsOfExperience) {
        ctx.fillText(`Experience: ${providerProfileData.personalInsights.serviceExpertise.yearsOfExperience} years`, rightX + 24, 368)
      }
      
      if (providerProfileData.personalInsights?.serviceExpertise?.servicesProvided) {
        ctx.fillText(`Services Provided: ${providerProfileData.personalInsights.serviceExpertise.servicesProvided}`, rightX + 24, 396)
      }
      
      if (providerProfileData.personalInsights?.performanceMetrics?.avgRating) {
        ctx.fillText(`Avg Rating: ${providerProfileData.personalInsights.performanceMetrics.avgRating}`, rightX + 24, 424)
      }

      // Footer brand note
      ctx.textAlign = 'center'
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 14px Inter, Arial'
      ctx.fillText('SewaBazaar • Service Booking & Home Solutions', width / 2, height - 36)
      ctx.fillStyle = '#475569'
      ctx.font = '13px Inter, Arial'
      ctx.fillText(appBaseUrl.replace(/^https?:\/\//, ''), width / 2, height - 16)

      const dataUrl = canvas.toDataURL('image/png')
      setQrImageDataUrl(dataUrl)
    } finally {
      setIsGeneratingQr(false)
    }
  }, [profileData, providerProfileData])

  /**
   * Open QR modal and generate branded QR code
   * 
   * This function handles the complete workflow for displaying the QR code modal:
   * 1. Sets modal visibility state to true
   * 2. Resets QR image data to trigger regeneration
   * 3. Calls generateBrandedQR to create new QR code
   * 
   * The function ensures a fresh QR code is generated each time the modal is opened
   * and provides visual feedback during generation.
   * 
   * User Experience:
   * - Shows loading spinner during QR generation
   * - Provides immediate modal visibility feedback
   * - Ensures QR code is always up-to-date
   */
  const openQrModal = useCallback(async () => {
    setQrModalOpen(true)
    setQrImageDataUrl("")
    await generateBrandedQR()
  }, [generateBrandedQR])

  

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
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header skeleton */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="flex-1 w-full">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-56" />
                      <Skeleton className="h-6 w-36 rounded-full" />
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-36" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs skeleton */}
        <div className="grid w-full grid-cols-4 gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex flex-wrap gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-28 rounded-full" />
                ))}
              </div>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Portfolio grid skeleton */}
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="w-full aspect-square rounded-lg" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto p-6 max-w-7xl"
    >
      {/* Enhanced Profile Header */}
      <motion.div variants={cardVariants} className="mb-8">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="relative group">
                <div className="h-32 w-32 rounded-full overflow-hidden bg-muted ring-4 ring-offset-4 ring-offset-background ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                  <Image
                    src={getImageUrl((profileData as any).profile_picture_url || profileData.profile_picture)}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <input
                  ref={profilePictureRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                />
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                  <User className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                        {`${profileData.first_name} ${profileData.last_name}`}
                      </h1>
                      {profileData.is_verified && (
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Provider
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-6 text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{profileData.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{profileData.phone || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {profileData.profile?.location_city || profileData.profile?.city || 'Location not set'}
                        </span>
                      </div>
                    </div>

                    {/* Profile Stats */}
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{profileData.profile?.avg_rating || '0.0'}</span>
                        <span className="text-muted-foreground">
                          ({profileData.profile?.reviews_count || 0} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <span className="font-medium">{profileData.profile?.years_of_experience || 0}</span>
                        <span className="text-muted-foreground">years exp.</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-green-500" />
                        <span className="font-medium">24</span>
                        <span className="text-muted-foreground">services</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button onClick={() => router.push('/dashboard/provider/settings')} className="gap-2">
                      <Edit2 className="h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button onClick={openQrModal} variant="outline" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Enhanced Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Summary */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Company</span>
                      <span>{profileData.profile?.company_name || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Display Name</span>
                      <span>{profileData.profile?.display_name || `${profileData.first_name} ${profileData.last_name}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Experience</span>
                      <span>{profileData.profile?.years_of_experience || 0} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Service Location</span>
                      <span>{profileData.profile?.location_city || profileData.profile?.city || 'Not specified'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certifications & Qualifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileData.profile?.certifications && profileData.profile.certifications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profileData.profile.certifications.map((cert, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center">
                          <Award className="h-3 w-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No certifications listed
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Account Settings Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>

            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Bio</p>
                      <p className="text-muted-foreground">
                        {profileData.profile?.bio || 'No bio provided yet. Add a bio to tell customers about your services and experience.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-muted-foreground">
                          {profileData.profile?.address || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">City</p>
                        <p className="text-muted-foreground">
                          {profileData.profile?.city || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Business Recommendations
                  </CardTitle>
                  <CardDescription>Personalized suggestions to grow your business</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Service Improvements</p>
                      <div className="space-y-2">
                        {providerProfileData.recommendations.serviceImprovements.map((suggestion) => (
                          <div key={suggestion.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium">{suggestion.suggestion}</p>
                                <p className="text-xs text-muted-foreground capitalize">Impact: {suggestion.potentialImpact}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Business Tips</p>
                      <div className="space-y-2">
                        {providerProfileData.recommendations.businessTips.map((tip) => (
                          <div key={tip.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium">{tip.tip}</p>
                                <p className="text-xs text-muted-foreground">Potential earnings: ₹{tip.potentialEarnings}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Your Achievements
              </CardTitle>
              <CardDescription>Badges and milestones you've earned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providerProfileData.achievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Expertise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Service Expertise
                </CardTitle>
                <CardDescription>Your service capabilities and experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Primary Category</span>
                    <Badge variant="outline">{providerProfileData.personalInsights.serviceExpertise.primaryCategory}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Years of Experience</span>
                    <span className="font-semibold">{providerProfileData.personalInsights.serviceExpertise.yearsOfExperience} years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Services Provided</span>
                    <span className="font-semibold">{providerProfileData.personalInsights.serviceExpertise.servicesProvided}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <span className="font-semibold">{providerProfileData.personalInsights.serviceExpertise.averageResponseTime} hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Business Analytics
                </CardTitle>
                <CardDescription>Your business performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Monthly Revenue</span>
                    <span className="font-semibold">₹{providerProfileData.personalInsights.businessAnalytics.monthlyRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Completed Bookings</span>
                    <span className="font-semibold">{providerProfileData.personalInsights.businessAnalytics.completedBookings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Customer Retention</span>
                    <span className="font-semibold">{providerProfileData.personalInsights.businessAnalytics.customerRetention}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Peak Booking Days</p>
                    <div className="flex flex-wrap gap-2">
                      {providerProfileData.personalInsights.businessAnalytics.peakBookingDays.map((day, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Your service quality metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{providerProfileData.personalInsights.performanceMetrics.avgRating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Reviews</span>
                    <span className="font-semibold">{providerProfileData.personalInsights.performanceMetrics.totalReviews}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">On-Time Completion</span>
                    <span className="font-semibold">{providerProfileData.personalInsights.performanceMetrics.onTimeCompletion}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cancellation Rate</span>
                    <span className="font-semibold">{providerProfileData.personalInsights.performanceMetrics.cancellationRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Business Milestones
                </CardTitle>
                <CardDescription>Track your progress towards business goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {providerProfileData.milestones.map((milestone) => (
                    <MilestoneCard key={milestone.id} milestone={milestone} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIconComponent className="h-5 w-5" />
                    Portfolio
                  </CardTitle>
                  <CardDescription>Showcase your work to potential customers</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => router.push('/dashboard/provider/settings')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Media
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardHeader>
            
            <CardContent>
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => router.push('/dashboard/provider/settings')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Manage Portfolio Media</AlertDialogTitle>
                                <AlertDialogDescription>
                                  To manage your portfolio media, please go to the settings page.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => router.push('/dashboard/provider/settings')}
                                  className="bg-primary hover:bg-primary/90"
                                >
                                  Go to Settings
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Add images or videos to showcase your work
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Share Your Profile
            </DialogTitle>
            <DialogDescription>
              Scan this QR code or share the link to connect with others
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {isGeneratingQr ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Generating your profile QR code...</p>
              </div>
            ) : qrImageDataUrl ? (
              <>
                <div className="flex flex-col items-center">
                  <div className="relative p-4 bg-white rounded-lg border">
                    <Image
                      src={qrImageDataUrl || '/placeholder.svg'}
                      alt="Profile QR Code"
                      width={1200}
                      height={800}
                      className="max-w-full h-auto"
                      unoptimized
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = qrImageDataUrl
                      link.download = `sewabazaar-profile-${profileData?.id || 'provider'}.png`
                      link.click()
                    }}
                    className="mt-4 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download QR Code
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {providerProfileData.sharing.profileUrl}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(providerProfileData.sharing.profileUrl)
                        showToast.success({
                          title: "Link Copied",
                          description: "Profile link copied to clipboard"
                        })
                      }}
                      className="ml-2 gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {providerProfileData.sharing.shareableLinks.map((link, index) => (
                      <Button 
                        key={index}
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Share on {link.platform}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Unable to generate QR code</p>
                <Button 
                  onClick={generateBrandedQR}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}