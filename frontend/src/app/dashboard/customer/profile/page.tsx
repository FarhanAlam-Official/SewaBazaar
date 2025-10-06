"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Calendar, 
  Star, 
  Phone, 
  Mail, 
  Edit, 
  Award, 
  TrendingUp, 
  Heart, 
  UserCheck, 
  CheckCircle,
  Crown,
  Gift,
  Target,
  Zap,
  Share2,
  Download,
  QrCode,
  MapPin,
  Clock,
  Users,
  MessageCircle,
  ThumbsUp,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Sparkles,
  Trophy,
  Flame,
  Diamond,
  Shield,
  BookOpen,
  Calendar as CalendarIcon,
  BarChart3,
  PieChart,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  RefreshCw,
  Settings,
  Bell,
  Globe,
  Lock,
  AlertTriangle
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { customerApi } from "@/services/customer.api"
import { showToast } from "@/components/ui/enhanced-toast"

/**
 * Interface for comprehensive customer profile data
 * 
 * This interface defines the complete structure for customer profile information,
 * organized into logical sections for better data management and type safety.
 * 
 * Structure:
 * - personalInsights: User behavior analytics and preferences
 * - achievements: Gamification elements and earned badges
 * - socialProfile: Social connections and engagement metrics
 * - milestones: Personal goals and progress tracking
 * - sharing: Profile sharing options and URLs
 * - recommendations: Personalized suggestions and tips
 * 
 * Design Principles:
 * - Type-safe property access with clear data structures
 * - Comprehensive coverage of profile features
 * - Extensible design for future enhancements
 * - Consistent naming conventions
 */
interface ProfileData {
  // Personal Insights & Analytics
  personalInsights: {
    servicePersonality: {
      primaryCategory: string
      preferredTimeSlots: string[]
      averageBookingValue: number
      bookingFrequency: 'low' | 'medium' | 'high'
      servicePreferences: string[]
    }
    spendingPatterns: {
      monthlyAverage: number
      highestSpendingMonth: string
      favoriteServiceType: string
      budgetConsciousness: 'low' | 'medium' | 'high'
    }
    behaviorAnalytics: {
      mostActiveDay: string
      preferredBookingMethod: 'mobile' | 'desktop' | 'app'
      responseTime: number // in hours
      cancellationRate: number
    }
  }
  
  // Comprehensive Achievement System
  achievements: {
    id: string
    title: string
    description: string
    icon: string
    unlockedAt: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    category: 'booking' | 'spending' | 'social' | 'loyalty' | 'special'
    points: number
    progress?: {
      current: number
      total: number
    }
  }[]
  
  // Social Features
  socialProfile: {
    profileVisibility: 'public' | 'private' | 'friends'
    socialStats: {
      profileViews: number
      connections: number
      reviewsReceived: number
      helpfulVotes: number
    }
    connections: {
      id: string
      name: string
      avatar: string
      connectionType: 'friend' | 'family' | 'colleague'
      mutualServices: number
      connectedAt: string
    }[]
    recentConnections: {
      id: string
      name: string
      action: 'viewed' | 'connected' | 'shared'
      timestamp: string
    }[]
  }
  
  // Personal Milestones & Goals
  milestones: {
    id: string
    title: string
    description: string
    target: number
    current: number
    deadline?: string
    category: 'bookings' | 'spending' | 'reviews' | 'social'
    reward?: string
  }[]
  
  // Profile Sharing & QR
  sharing: {
    profileUrl: string
    qrCode: string
    shareableLinks: {
      platform: string
      url: string
      icon: string
    }[]
  }
  
  // Personal Recommendations
  recommendations: {
    serviceSuggestions: {
      id: string
      title: string
      reason: string
      confidence: number
      category: string
    }[]
    budgetTips: {
      id: string
      tip: string
      potentialSavings: number
      category: string
    }[]
    profileImprovements: {
      id: string
      suggestion: string
      impact: 'low' | 'medium' | 'high'
      category: string
    }[]
  }
}

// Animation variants for smooth page transitions
// These variants control the entrance animations for the entire page
// using staggered delays to create a cascading effect
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
// These variants provide subtle entrance animations for card components
// with smooth easing for a polished user experience
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

/**
 * Achievement Badge Component
 * Displays individual achievement with rarity-based styling and progress tracking
 * @param achievement - The achievement data to display
 */
const AchievementBadge = ({ achievement }: { achievement: ProfileData['achievements'][0] }) => {
  const rarityColors = {
    common: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600',
    rare: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600',
    epic: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-600',
    legendary: 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600'
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Award className="h-4 w-4" />
      case 'rare': return <Star className="h-4 w-4" />
      case 'epic': return <Trophy className="h-4 w-4" />
      case 'legendary': return <Diamond className="h-4 w-4" />
      default: return <Award className="h-4 w-4" />
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="relative group cursor-pointer"
    >
      <Card className={`p-4 hover:shadow-xl transition-all duration-300 border-2 ${rarityColors[achievement.rarity]}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${rarityColors[achievement.rarity]} shadow-lg`}>
            {getRarityIcon(achievement.rarity)}
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

/**
 * Milestone Progress Component
 * Displays personal milestones with progress tracking and rewards
 * @param milestone - The milestone data to display
 */
const MilestoneCard = ({ milestone }: { milestone: ProfileData['milestones'][0] }) => {
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
 * Social Connection Component
 * Displays individual social connections with mutual service information
 * @param connection - The connection data to display
 */
const ConnectionCard = ({ connection }: { connection: ProfileData['socialProfile']['connections'][0] }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Card className="p-4 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={connection.avatar || ''} />
            <AvatarFallback>{(connection.name || 'User').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{connection.name || 'User'}</h4>
            <p className="text-xs text-muted-foreground capitalize">{connection.connectionType || 'Connection'}</p>
            <p className="text-xs text-muted-foreground">
              {connection.mutualServices || 0} mutual services
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              Connected {new Date(connection.connectedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

/**
 * Customer Profile Page Component
 * 
 * This is the main profile page for customers in the SewaBazaar application.
 * It displays comprehensive profile information including:
 * - Personal insights and analytics
 * - Achievements and milestones
 * - Social connections and statistics
 * - Goals and progress tracking
 * - Profile sharing capabilities via QR code and social platforms
 * 
 * The page is organized into tabbed sections for better information organization
 * and includes interactive elements for profile management and sharing.
 * 
 * Key Features:
 * - Responsive design that works on all device sizes
 * - Animated transitions for enhanced user experience
 * - Professional UI components with consistent styling
 * - Comprehensive error handling with user-friendly notifications
 * - Profile sharing via QR code generation
 * - Social connection management
 * - Achievement and milestone tracking
 */
export default function CustomerProfilePage() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("insights")
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrImageDataUrl, setQrImageDataUrl] = useState<string>("")
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)

  /**
   * Load profile data from APIs
   * 
   * This function fetches comprehensive profile data from multiple API endpoints:
   * - Dashboard statistics for overview metrics
   * - Booking history for service usage patterns
   * - Social connections and engagement data
   * 
   * The function uses Promise.allSettled to handle API calls concurrently,
   * ensuring that failure of one API doesn't block others.
   * 
   * In a production environment, this would fetch real data from APIs.
   * Currently using mock data for demonstration purposes.
   * 
   * Error Handling:
   * - Uses enhanced toast notifications to inform users of failures
   * - Provides specific error messages for better user experience
   * - Maintains loading states during data fetching
   */
  const loadProfileData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load dashboard stats for profile overview
      const [statsResult, bookingsResult] = await Promise.allSettled([
        customerApi.getDashboardStats(),
        customerApi.getBookings()
      ])

      const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
      const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value : null

      // Calculate additional stats
      const totalBookings = stats?.totalBookings || 0
      const completedServices = bookings?.completed?.length || 0
      const averageRating = 4.8 // This would come from reviews API
      const totalSpent = stats?.totalSpent || 0
      
      // Resolve base URL for profile links
      const appBaseUrl = (process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')) as string
      const profileUrl = `${appBaseUrl.replace(/\/$/, '')}/profile/${user?.id}`

      // Mock data for demonstration - in real app, this would come from APIs
      const mockProfileData: ProfileData = {
        personalInsights: {
          servicePersonality: {
            primaryCategory: 'Home Services',
            preferredTimeSlots: ['Morning (9-12)', 'Afternoon (2-5)'],
            averageBookingValue: 2500,
            bookingFrequency: 'medium',
            servicePreferences: ['Cleaning', 'Plumbing', 'Electrical']
          },
          spendingPatterns: {
            monthlyAverage: 3500,
            highestSpendingMonth: 'December',
            favoriteServiceType: 'Home Cleaning',
            budgetConsciousness: 'medium'
          },
          behaviorAnalytics: {
            mostActiveDay: 'Saturday',
            preferredBookingMethod: 'mobile',
            responseTime: 2.5,
            cancellationRate: 5
          }
        },
        achievements: [
          {
            id: '1',
            title: 'First Booking',
            description: 'Made your first service booking',
            icon: 'calendar',
            unlockedAt: new Date().toISOString(),
            rarity: 'common',
            category: 'booking',
            points: 10
          },
          {
            id: '2',
            title: 'Loyal Customer',
            description: 'Completed 10+ services',
            icon: 'heart',
            unlockedAt: new Date().toISOString(),
            rarity: 'rare',
            category: 'loyalty',
            points: 50
          },
          {
            id: '3',
            title: 'Review Master',
            description: 'Left 20+ reviews',
            icon: 'star',
            unlockedAt: new Date().toISOString(),
            rarity: 'epic',
            category: 'social',
            points: 100
          },
          {
            id: '4',
            title: 'Social Butterfly',
            description: 'Connected with 5+ friends',
            icon: 'users',
            unlockedAt: new Date().toISOString(),
            rarity: 'rare',
            category: 'social',
            points: 75
          },
          {
            id: '5',
            title: 'Big Spender',
            description: 'Spent over ₹50,000 total',
            icon: 'trending-up',
            unlockedAt: new Date().toISOString(),
            rarity: 'epic',
            category: 'spending',
            points: 150
          },
          {
            id: '6',
            title: 'Profile Perfectionist',
            description: 'Complete your profile 100%',
            icon: 'user-check',
            unlockedAt: new Date().toISOString(),
            rarity: 'common',
            category: 'special',
            points: 25,
            progress: {
              current: 8,
              total: 10
            }
          }
        ],
        socialProfile: {
          profileVisibility: 'public',
          socialStats: {
            profileViews: 1247,
            connections: 23,
            reviewsReceived: 15,
            helpfulVotes: 89
          },
          connections: [
            {
              id: '1',
              name: 'Sarah Johnson',
              avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson',
              connectionType: 'friend',
              mutualServices: 3,
              connectedAt: '2024-01-15'
            },
            {
              id: '2',
              name: 'Mike Chen',
              avatar: 'https://ui-avatars.com/api/?name=Mike+Chen',
              connectionType: 'colleague',
              mutualServices: 1,
              connectedAt: '2024-02-20'
            },
            {
              id: '3',
              name: 'Emma Wilson',
              avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson',
              connectionType: 'family',
              mutualServices: 5,
              connectedAt: '2024-01-10'
            }
          ],
          recentConnections: [
            {
              id: '1',
              name: 'Alex Thompson',
              action: 'viewed',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: '2',
              name: 'Lisa Brown',
              action: 'connected',
              timestamp: new Date(Date.now() - 7200000).toISOString()
            }
          ]
        },
        milestones: [
          {
            id: '1',
            title: 'Service Explorer',
            description: 'Book services in 5 different categories',
            target: 5,
            current: 3,
            category: 'bookings',
            reward: '10% discount on next booking'
          },
          {
            id: '2',
            title: 'Review Champion',
            description: 'Write 25 helpful reviews',
            target: 25,
            current: 18,
            category: 'reviews',
            reward: 'Premium support access'
          },
          {
            id: '3',
            title: 'Social Connector',
            description: 'Connect with 50 friends',
            target: 50,
            current: 23,
            category: 'social',
            reward: 'Exclusive referral bonus'
          },
          {
            id: '4',
            title: 'Budget Master',
            description: 'Save ₹10,000 through smart bookings',
            target: 10000,
            current: 6750,
            category: 'spending',
            reward: 'Free premium service'
          }
        ],
        sharing: {
          profileUrl: profileUrl,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`,
          shareableLinks: [
            {
              platform: 'WhatsApp',
              url: `https://wa.me/?text=${encodeURIComponent('Check out my SewaBazaar profile: ' + profileUrl)}`,
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
        },
        recommendations: {
          serviceSuggestions: [
            {
              id: '1',
              title: 'Deep Carpet Cleaning',
              reason: 'Based on your home cleaning preferences',
              confidence: 85,
              category: 'Home Services'
            },
            {
              id: '2',
              title: 'Garden Landscaping',
              reason: 'Popular among users with similar spending patterns',
              confidence: 72,
              category: 'Outdoor Services'
            }
          ],
          budgetTips: [
            {
              id: '1',
              tip: 'Book services during off-peak hours (weekdays)',
              potentialSavings: 500,
              category: 'Timing'
            },
            {
              id: '2',
              tip: 'Bundle multiple services for package discounts',
              potentialSavings: 1200,
              category: 'Bundling'
            }
          ],
          profileImprovements: [
            {
              id: '1',
              suggestion: 'Add a profile bio to increase connection requests',
              impact: 'medium',
              category: 'Social'
            },
            {
              id: '2',
              suggestion: 'Upload a profile picture for better recognition',
              impact: 'high',
              category: 'Profile'
            }
          ]
        }
      }

      setProfileData(mockProfileData)
    } catch (error) {
      // Show error notification to user instead of logging to console
      showToast.error({
        title: "Error",
        description: "Failed to load profile data. Please try again.",
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  /**
   * Generate branded QR code image for profile sharing
   * Creates a visually appealing QR code with brand elements
   * 
   * This function generates a professional-looking QR code that includes:
   * - Branding elements with the SewaBazaar logo
   * - User profile information
   * - Social sharing capabilities
   * 
   * The function uses HTML5 Canvas to create a two-column poster layout
   * with the QR code on the left and profile details on the right.
   */
  const generateBrandedQR = useCallback(async () => {
    // Early return if profile data is not available
    if (!profileData) return;
    
    const appBaseUrl = (process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')) as string
    const profileUrl = `${appBaseUrl.replace(/\/$/, '')}/profile/${user?.id}`
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
        avatarImg.src = user?.profile_picture_url || '/placeholder.svg'
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
      const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'SewaBazaar User'
      ctx.fillText(fullName, rightX + 24 + avatarSize + 16, 208)
      ctx.font = '16px Inter, Arial'
      if (user?.email) ctx.fillText(user.email, rightX + 24 + avatarSize + 16, 236)
      if (user?.phone) ctx.fillText(user.phone, rightX + 24 + avatarSize + 16, 262)

      // Additional profile details (tier, category, stats)
      // Add null checks for all profileData accesses to prevent TypeScript errors
      ctx.font = 'bold 18px Inter, Arial'
      ctx.fillText('Profile Details', rightX + 24, 310)
      ctx.font = '16px Inter, Arial'
      ctx.fillStyle = '#0f172a'
      
      // Safely access profileData properties with optional chaining
      if (profileData.personalInsights?.servicePersonality?.primaryCategory) {
        ctx.fillText(`Primary Category: ${profileData.personalInsights.servicePersonality.primaryCategory}`, rightX + 24, 340)
      }
      
      if (profileData.personalInsights?.servicePersonality?.bookingFrequency) {
        ctx.fillText(`Booking Frequency: ${profileData.personalInsights.servicePersonality.bookingFrequency}`, rightX + 24, 368)
      }
      
      if (profileData.personalInsights?.servicePersonality?.averageBookingValue) {
        ctx.fillText(`Avg Booking Value: ₹${profileData.personalInsights.servicePersonality.averageBookingValue}`, rightX + 24, 396)
      }
      
      if (profileData.socialProfile?.socialStats?.connections !== undefined) {
        ctx.fillText(`Connections: ${profileData.socialProfile.socialStats.connections}`, rightX + 24, 424)
      }
      
      if (profileData.socialProfile?.socialStats?.reviewsReceived !== undefined) {
        ctx.fillText(`Reviews: ${profileData.socialProfile.socialStats.reviewsReceived}`, rightX + 24, 452)
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
  }, [profileData, user?.id, user?.first_name, user?.last_name, user?.email, user?.phone, user?.profile_picture_url])

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

  /**
   * Handle profile sharing via native sharing API or clipboard
   * 
   * This function provides two sharing mechanisms:
   * 1. Native Web Share API (when available) - provides native sharing dialog
   * 2. Clipboard fallback - copies profile URL to clipboard
   * 
   * The function automatically detects which method to use based on browser support.
   * 
   * User Experience:
   * - Shows success toast notification when URL is copied
   * - Gracefully handles user cancellation of sharing dialog
   * - Provides clear feedback for all actions
   * 
   * @returns Promise that resolves when sharing action is complete
   */
  const handleShareProfile = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My SewaBazaar Profile',
          text: 'Check out my service profile on SewaBazaar!',
          url: profileData?.sharing.profileUrl
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(profileData?.sharing.profileUrl || '')
      showToast.success({
        title: "Profile URL copied!",
        description: "Share this link with your friends",
        duration: 3000
      })
    }
  }, [profileData?.sharing.profileUrl])

  /**
   * Handle QR code download
   * 
   * This function creates a downloadable link for the generated QR code image
   * and triggers the browser's download mechanism.
   * 
   * The downloaded file is named with the user's ID for easy identification.
   * 
   * Implementation Details:
   * - Uses HTML5 anchor element with download attribute
   * - Handles both generated QR images and fallback QR URLs
   * - Provides consistent naming convention for downloaded files
   * 
   * Fallback Behavior:
   * - If generated QR image is not available, uses the QR code URL directly
   * - Ensures download functionality works even if image generation fails
   */
  const handleDownloadQR = useCallback(() => {
    const link = document.createElement('a')
    link.href = qrImageDataUrl || profileData?.sharing.qrCode || ''
    link.download = `sewabazaar-profile-${user?.id}.png`
    link.click()
  }, [qrImageDataUrl, profileData?.sharing.qrCode, user?.id])

  // Show loading state while checking auth and loading profile data
  if (loading || isLoading) {
    return (
      <div className="container py-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </motion.div>
      </div>
    )
  }

  // Show error state if profile data failed to load
  if (!profileData) {
    return (
      <div className="container py-6 max-w-7xl">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load profile</h3>
          <p className="text-muted-foreground mb-4">There was an error loading your profile data.</p>
          <Button onClick={loadProfileData}>Try Again</Button>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container py-6 max-w-7xl"
    >
      {/* Enhanced Profile Header with Social Features */}
      <motion.div variants={cardVariants} className="mb-8">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="relative group">
                <div className="h-32 w-32 rounded-full overflow-hidden bg-muted ring-4 ring-offset-4 ring-offset-background ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
              <Image
                src={user?.profile_picture_url || "/placeholder.svg"}
                alt="Profile"
                width={128}
                height={128}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                unoptimized={!!user?.profile_picture_url}
                priority
              />
            </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                  <UserCheck className="h-4 w-4" />
            </div>
          </div>
              
          <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
            <div className="flex items-center gap-4 mb-2">
                      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                        {user?.first_name} {user?.last_name}
                      </h1>
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        <Crown className="h-3 w-3 mr-1" />
                        {profileData.socialProfile.profileVisibility} Profile
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-6 text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{user?.phone || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">{profileData.socialProfile.socialStats.profileViews} profile views</span>
                      </div>
                    </div>

                    {/* Social Stats */}
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-medium">{profileData.socialProfile.socialStats.connections}</span>
                        <span className="text-muted-foreground">connections</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{profileData.socialProfile.socialStats.reviewsReceived}</span>
                        <span className="text-muted-foreground">reviews</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{profileData.socialProfile.socialStats.helpfulVotes}</span>
                        <span className="text-muted-foreground">helpful votes</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleShareProfile} className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share Profile
                    </Button>
                    <Button variant="outline" onClick={openQrModal} className="gap-2">
                      <QrCode className="h-4 w-4" />
                      Show QR
                    </Button>
              <Link href="/dashboard/customer/settings">
                      <Button className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
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
          <TabsTrigger value="insights">Personal Insights</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="goals">Goals & Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Personality */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Service Personality
                </CardTitle>
                <CardDescription>Your unique service preferences and patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Primary Category</span>
                    <Badge variant="outline">{profileData.personalInsights.servicePersonality.primaryCategory}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Booking Frequency</span>
                    <Badge variant="secondary" className="capitalize">
                      {profileData.personalInsights.servicePersonality.bookingFrequency}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Booking Value</span>
                    <span className="font-semibold">₹{profileData.personalInsights.servicePersonality.averageBookingValue}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Preferred Time Slots</p>
                  <div className="flex flex-wrap gap-2">
                    {profileData.personalInsights.servicePersonality.preferredTimeSlots.map((slot, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {slot}
                      </Badge>
                    ))}
        </div>
      </div>

                <div>
                  <p className="text-sm font-medium mb-2">Service Preferences</p>
                  <div className="flex flex-wrap gap-2">
                    {profileData.personalInsights.servicePersonality.servicePreferences.map((pref, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {pref}
                      </Badge>
                    ))}
                  </div>
            </div>
          </CardContent>
        </Card>

            {/* Spending Patterns */}
        <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Spending Patterns
                </CardTitle>
                <CardDescription>Your spending behavior and budget insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Monthly Average</span>
                    <span className="font-semibold">₹{profileData.personalInsights.spendingPatterns.monthlyAverage}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Highest Spending Month</span>
                    <Badge variant="outline">{profileData.personalInsights.spendingPatterns.highestSpendingMonth}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Favorite Service Type</span>
                    <span className="text-sm">{profileData.personalInsights.spendingPatterns.favoriteServiceType}</span>
            </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Budget Consciousness</span>
                    <Badge variant="secondary" className="capitalize">
                      {profileData.personalInsights.spendingPatterns.budgetConsciousness}
                    </Badge>
            </div>
            </div>
          </CardContent>
        </Card>

            {/* Behavior Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Behavior Analytics
                </CardTitle>
                <CardDescription>Your platform usage patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Most Active Day</span>
                    <Badge variant="outline">{profileData.personalInsights.behaviorAnalytics.mostActiveDay}</Badge>
                      </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Preferred Booking Method</span>
                    <Badge variant="secondary" className="capitalize">
                      {profileData.personalInsights.behaviorAnalytics.preferredBookingMethod}
                    </Badge>
                        </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <span className="text-sm">{profileData.personalInsights.behaviorAnalytics.responseTime} hours</span>
                        </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cancellation Rate</span>
                    <span className="text-sm">{profileData.personalInsights.behaviorAnalytics.cancellationRate}%</span>
                      </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Personal Recommendations
                </CardTitle>
                <CardDescription>Tailored suggestions just for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Service Suggestions</p>
                  <div className="space-y-2">
                    {profileData.recommendations.serviceSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">{suggestion.title}</p>
                            <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.confidence}% match
                          </Badge>
                        </div>
                      </div>
                          ))}
                        </div>
                      </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Budget Tips</p>
                  <div className="space-y-2">
                    {profileData.recommendations.budgetTips.map((tip) => (
                      <div key={tip.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">{tip.tip}</p>
                            <p className="text-xs text-muted-foreground">Potential savings: ₹{tip.potentialSavings}</p>
                          </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Your Achievements
              </CardTitle>
              <CardDescription>Badges and milestones you've earned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileData.achievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Social Stats */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Social Statistics
                </CardTitle>
                <CardDescription>Your social engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Eye className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{profileData.socialProfile.socialStats.profileViews}</p>
                    <p className="text-sm text-muted-foreground">Profile Views</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{profileData.socialProfile.socialStats.connections}</p>
                    <p className="text-sm text-muted-foreground">Connections</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold">{profileData.socialProfile.socialStats.reviewsReceived}</p>
                    <p className="text-sm text-muted-foreground">Reviews Received</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <ThumbsUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{profileData.socialProfile.socialStats.helpfulVotes}</p>
                    <p className="text-sm text-muted-foreground">Helpful Votes</p>
                      </div>
                    </div>
              </CardContent>
            </Card>

            {/* Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Your Connections
                </CardTitle>
                <CardDescription>People you're connected with</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profileData.socialProfile.connections.map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} />
                  ))}
                    </div>
              </CardContent>
            </Card>
                  </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Personal Goals & Milestones
              </CardTitle>
              <CardDescription>Track your progress towards personal goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.milestones.map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Preview Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[960px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Profile QR Code</DialogTitle>
          </DialogHeader>
          <div className="w-full flex flex-col items-center justify-center gap-4">
            {isGeneratingQr ? (
              <div className="py-10">
                <LoadingSpinner />
              </div>
            ) : qrImageDataUrl ? (
              <Image src={qrImageDataUrl} alt="SewaBazaar Profile QR" width={1200} height={800} className="w-full rounded-xl border" unoptimized />
            ) : (
              <div className="py-10 text-sm text-muted-foreground">Unable to generate QR image</div>
            )}
    </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={generateBrandedQR} disabled={isGeneratingQr}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={handleDownloadQR} disabled={!qrImageDataUrl && isGeneratingQr}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}