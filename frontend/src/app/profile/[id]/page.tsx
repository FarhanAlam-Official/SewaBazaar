"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Star, Users, Calendar, MapPin, Shield, Sparkles, Trophy, Crown, Gift, Heart
} from "lucide-react"

interface PublicProfileData {
  id: string
  name: string
  avatar: string
  bio?: string
  city?: string
  stats: {
    totalBookings: number
    reviews: number
    helpfulVotes: number
    memberSince: string
    tier: string
  }
  highlights: string[]
  topCategories: { name: string; count: number }[]
  recentReviews: { id: string; provider: string; rating: number; text: string; date: string }[]
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PublicProfileData | null>(null)

  useEffect(() => {
    // TODO: Replace with real API call `/api/public/profile/{id}`
    const timer = setTimeout(() => {
      setData({
        id: profileId,
        name: "Alex Johnson",
        avatar: "https://ui-avatars.com/api/?name=Alex+Johnson",
        bio: "Home services enthusiast. I love clean spaces and reliable pros!",
        city: "Kathmandu",
        stats: {
          totalBookings: 42,
          reviews: 18,
          helpfulVotes: 96,
          memberSince: "Apr 2023",
          tier: "Gold"
        },
        highlights: [
          "On-time and organized",
          "Prefers morning slots",
          "Trusted reviewer"
        ],
        topCategories: [
          { name: "Home Cleaning", count: 16 },
          { name: "Plumbing", count: 8 },
          { name: "Electrical", count: 6 }
        ],
        recentReviews: [
          { id: "1", provider: "CleanPro Services", rating: 5, text: "Thorough and professional!", date: "2025-08-21" },
          { id: "2", provider: "FixIt Plumbing", rating: 4, text: "Quick response and fair pricing.", date: "2025-07-14" },
          { id: "3", provider: "BrightSpark Electric", rating: 5, text: "Solved our issue perfectly.", date: "2025-06-02" }
        ]
      })
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [profileId])

  if (loading || !data) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          <Skeleton className="h-[520px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full overflow-hidden ring-4 ring-primary/20">
                  {data.avatar ? (
                    <Image src={data.avatar} alt={data.name} width={80} height={80} className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">{(data.name || 'User').charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{data.name}</h1>
                  <Badge variant="secondary" className="gap-1">
                    <Crown className="h-3 w-3" /> {data.stats.tier}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" /> {data.city}
                  </Badge>
                </div>
                {data.bio && <p className="text-muted-foreground mt-1">{data.bio}</p>}
                <div className="flex gap-6 mt-3 text-sm">
                  <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Member since {data.stats.memberSince}</div>
                  <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {data.stats.totalBookings} bookings</div>
                  <div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> {data.stats.reviews} reviews</div>
                </div>
              </div>
              <div className="hidden sm:block">
                <Button asChild variant="outline">
                  <Link href={typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/'}>Book a Service</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left: Highlights & Categories */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Highlights</CardTitle>
              <CardDescription>What others can know about me</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.highlights.map((h, i) => (
                  <Badge key={i} variant="secondary">{h}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" /> Top Categories</CardTitle>
              <CardDescription>Most used service categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                {data.topCategories.map((c) => (
                  <div key={c.name} className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">{c.name}</p>
                    <p className="text-2xl font-bold mt-1">{c.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Recent Reviews</CardTitle>
              <CardDescription>What I’ve shared recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentReviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{r.provider}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{r.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(r.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Public info card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" /> Public Profile</CardTitle>
              <CardDescription>Safe-to-share details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Visibility</span>
                <Badge variant="outline">Public</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tier</span>
                <Badge variant="secondary" className="gap-1"><Crown className="h-3 w-3" /> {data.stats.tier}</Badge>
              </div>
              <div className="pt-2">
                <Button asChild className="w-full">
                  <Link href={typeof window !== 'undefined' ? `${window.location.origin}/services` : '/services'}>Explore Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


