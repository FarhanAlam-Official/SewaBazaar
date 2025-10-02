"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, RefreshCcw } from "lucide-react"
import { providerApi } from "@/services/provider.api"
import { reviewsApi } from "@/services/api"
import { ReviewCard } from "@/components/reviews/ReviewCard"
import { showToast } from "@/components/ui/enhanced-toast"

type ProviderReview = {
  id: number
  rating: number
  comment: string
  created_at: string
  service_title?: string
  customer?: { display_name?: string }
  provider?: { display_name?: string; profile_picture?: string }
  images?: { image_url?: string }[]
  provider_response?: string | null
  provider_response_created_at?: string | null
  provider_response_updated_at?: string | null
}

export default function ReviewsAndRatings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ProviderReview[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [ordering, setOrdering] = useState<'created_at' | '-created_at' | 'rating' | '-rating'>('-created_at')
  const [summary, setSummary] = useState<{ average?: number; count?: number; breakdown?: Record<number, number> } | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({})

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = { page, page_size: pageSize, ordering }
      if (ratingFilter !== 'all') params.rating = Number(ratingFilter)
      const data = await providerApi.getProviderReviews(params)
      const list = Array.isArray(data) ? data : (data.results || [])
      setReviews(list)
      setCount(data.count || list.length || 0)
      setSummary(data.rating_summary || null)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Failed to load reviews')
      showToast.error({ title: 'Failed to load reviews', description: e?.message || 'Please try again.' })
      setReviews([])
      setCount(0)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, ratingFilter, ordering])

  const averageDisplay = useMemo(() => {
    if (!summary?.average) return '0.0'
    const n = typeof summary.average === 'number' ? summary.average : Number(summary.average)
    return n.toFixed(1)
  }, [summary])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((count || 0) / pageSize))
  }, [count, pageSize])

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Reviews & Ratings</h1>
        <div className="flex items-center gap-2">
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">5 stars</SelectItem>
              <SelectItem value="4">4 stars</SelectItem>
              <SelectItem value="3">3 stars</SelectItem>
              <SelectItem value="2">2 stars</SelectItem>
              <SelectItem value="1">1 star</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ordering} onValueChange={(v: any) => setOrdering(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created_at">Newest</SelectItem>
              <SelectItem value="created_at">Oldest</SelectItem>
              <SelectItem value="-rating">Highest rated</SelectItem>
              <SelectItem value="rating">Lowest rated</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2">{averageDisplay}</h2>
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className={`h-5 w-5 ${i <= Math.round(Number(averageDisplay)) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Overall Rating</p>
              <p className="text-sm text-muted-foreground">Based on {summary?.count || 0} reviews</p>
            </div>
          )}
        </Card>

        <Card className="p-6 lg:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {[5,4,3,2,1].map((star) => {
              const total = summary?.count || 0
              const num = summary?.breakdown?.[star] || 0
              const pct = total > 0 ? Math.round((num / total) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-20">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span>{star}</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-3 w-full" />
                  ) : (
                    <Progress value={pct} className="flex-1" />
                  )}
                  <span className="text-sm text-muted-foreground w-12">{pct}%</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Reviews</h2>
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v)
            setRatingFilter(v === 'all' ? 'all' : v)
            setPage(1)
          }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="5">5★</TabsTrigger>
              <TabsTrigger value="4">4★</TabsTrigger>
              <TabsTrigger value="3">3★</TabsTrigger>
              <TabsTrigger value="2">2★</TabsTrigger>
              <TabsTrigger value="1">1★</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 border-b pb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-sm text-muted-foreground">No reviews yet.</div>
        ) : (
          <div className="space-y-6">
            {reviews.map((rev) => {
              const images = (rev.images || []).map((img) => img.image_url || '')
              return (
                <div key={rev.id} className="space-y-3 border-b pb-6">
                  {/* Emphasize customer identity */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-sm font-semibold">
                        {(rev.customer?.display_name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{rev.customer?.display_name || 'Customer'}</div>
                        <div className="text-xs text-muted-foreground">{rev.service_title || 'Service'}{(rev as any).booking_id ? ` • Booking #${(rev as any).booking_id}` : ''}</div>
                      </div>
                    </div>
                    <Badge variant="outline">{new Date(rev.created_at).toLocaleDateString()}</Badge>
                  </div>
                  <ReviewCard
                    review={{
                      id: String(rev.id),
                      serviceName: rev.service_title || 'Service',
                      providerName: rev.provider?.display_name || 'You',
                      providerProfileImage: rev.provider?.profile_picture,
                      rating: rev.rating,
                      comment: rev.comment,
                      date: rev.created_at,
                      images,
                      responseFromProvider: rev.provider_response || '',
                      responseDate: rev.provider_response_updated_at || rev.provider_response_created_at || undefined,
                      // Optional extras used by ReviewCard visuals
                      serviceDate: (rev as any).booking_date || rev.created_at,
                      tags: []
                    }}
                    canModify={false}
                  />
                  <div className="text-xs text-muted-foreground">
                    Reviewed by <span className="font-medium text-foreground">{rev.customer?.display_name || 'Customer'}</span>
                    { (rev as any).booking_id ? <span> • Booking #{(rev as any).booking_id}</span> : null }
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <input
                      className="flex-1 border rounded-md px-3 py-2 text-sm bg-background"
                      placeholder={rev.provider_response ? "Update your reply" : "Write a reply to this review"}
                      value={replyDrafts[String(rev.id)] ?? ''}
                      onChange={(e) => setReplyDrafts((d) => ({ ...d, [String(rev.id)]: e.target.value }))}
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        const text = (replyDrafts[String(rev.id)] ?? '').trim()
                        if (!text) {
                          showToast.error({ title: 'Reply required', description: 'Please enter a reply before submitting.' })
                          return
                        }
                        try {
                          setReplyLoading((m) => ({ ...m, [String(rev.id)]: true }))
                          const updated = await reviewsApi.replyToReview(rev.id, text)
                          setReviews((prev) => prev.map((r) => r.id === rev.id ? { ...r, ...updated } : r))
                          setReplyDrafts((d) => ({ ...d, [String(rev.id)]: '' }))
                          showToast.success({ title: 'Reply posted', description: 'Your reply has been saved.' })
                        } catch (err: any) {
                          const msg = err?.response?.data?.error || err?.message || 'Failed to post reply'
                          showToast.error({ title: 'Reply failed', description: msg })
                        } finally {
                          setReplyLoading((m) => ({ ...m, [String(rev.id)]: false }))
                        }
                      }}
                      disabled={!!replyLoading[String(rev.id)]}
                    >
                      {replyLoading[String(rev.id)] ? 'Saving...' : (rev.provider_response ? 'Update Reply' : 'Post Reply')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="default" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}