"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Star, ThumbsUp, ThumbsDown, Filter, Search, 
  TrendingUp, Award, CheckCircle2, Verified,
  MessageCircle, Flag, MoreHorizontal, Camera,
  Calendar, User, Shield, Crown, Diamond,
  BarChart3, PieChart, TrendingDown, Plus,
  ChevronDown, ChevronUp, ArrowUpDown, Eye, Heart
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ServiceReviewsProps, DetailedReview, ReviewSummary, ReviewFormData } from '@/types/service-detail'
import { cn } from '@/lib/utils'

interface ServiceReviewsSectionProps extends ServiceReviewsProps {
  onHelpfulClick?: (reviewId: number, helpful: boolean) => void
  onReportReview?: (reviewId: number) => void
  className?: string
}

export function ServiceReviewsSection({ 
  reviews, 
  summary, 
  onReviewSubmit, 
  canReview,
  isLoading,
  onHelpfulClick,
  onReportReview,
  className 
}: ServiceReviewsSectionProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewFormData, setReviewFormData] = useState<Partial<ReviewFormData>>({
    overall_rating: 0,
    quality_rating: 0,
    value_rating: 0,
    communication_rating: 0,
    punctuality_rating: 0,
    would_recommend: true
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filterRating, setFilterRating] = useState('all')
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set())

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      const matchesSearch = review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (review.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRating = filterRating === 'all' || review.overall_rating === parseInt(filterRating)
      return matchesSearch && matchesRating
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'highest-rated':
          return b.overall_rating - a.overall_rating
        case 'lowest-rated':
          return a.overall_rating - b.overall_rating
        case 'most-helpful':
          return b.helpful_count - a.helpful_count
        default:
          return 0
      }
    })

  // Handle rating click
  const handleRatingClick = (category: keyof ReviewFormData, rating: number) => {
    setReviewFormData(prev => ({ ...prev, [category]: rating }))
  }

  // Handle review submission
  const handleSubmitReview = () => {
    if (!reviewFormData.overall_rating || !reviewFormData.comment) return

    const completeFormData: ReviewFormData = {
      service_id: 0, // Will be set by parent
      overall_rating: reviewFormData.overall_rating!,
      quality_rating: reviewFormData.quality_rating!,
      value_rating: reviewFormData.value_rating!,
      communication_rating: reviewFormData.communication_rating!,
      punctuality_rating: reviewFormData.punctuality_rating!,
      title: reviewFormData.title,
      comment: reviewFormData.comment!,
      pros: reviewFormData.pros,
      cons: reviewFormData.cons,
      project_category: reviewFormData.project_category,
      project_budget_range: reviewFormData.project_budget_range,
      would_recommend: reviewFormData.would_recommend!
    }

    onReviewSubmit(completeFormData)
    setShowReviewForm(false)
    setReviewFormData({
      overall_rating: 0,
      quality_rating: 0,
      value_rating: 0,
      communication_rating: 0,
      punctuality_rating: 0,
      would_recommend: true
    })
  }

  // Toggle expanded review
  const toggleExpandedReview = (reviewId: number) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  // Render star rating
  const StarRating = ({ rating, size = 'sm', onChange }: { 
    rating: number
    size?: 'sm' | 'md' | 'lg'
    onChange?: (rating: number) => void 
  }) => {
    const sizeClass = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5', 
      lg: 'h-6 w-6'
    }[size]

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange?.(star)}
            disabled={!onChange}
            className={cn(
              "transition-colors",
              onChange && "hover:scale-110 cursor-pointer"
            )}
          >
            <Star 
              className={cn(
                sizeClass,
                star <= rating 
                  ? "text-yellow-400 fill-yellow-400" 
                  : "text-gray-300 dark:text-gray-600"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn("space-y-8", className)}
    >
      {/* Reviews Header & Summary */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Customer Reviews
          </h2>
          {canReview && (
            <Button 
              onClick={() => setShowReviewForm(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Write Review
            </Button>
          )}
        </div>

        {/* Rating Summary */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-5xl font-bold text-slate-900 dark:text-white mb-2">
                  {typeof summary.average_rating === 'number' ? summary.average_rating.toFixed(1) : '0.0'}
                </div>
                <StarRating rating={summary.average_rating} size="lg" />
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Based on {summary.total_reviews.toLocaleString()} reviews
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <TrendingUp className={cn(
                    "h-5 w-5",
                    summary.recent_trend === 'improving' ? "text-emerald-500" :
                    summary.recent_trend === 'declining' ? "text-red-500" : "text-slate-500"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    summary.recent_trend === 'improving' ? "text-emerald-600" :
                    summary.recent_trend === 'declining' ? "text-red-600" : "text-slate-600"
                  )}>
                    {summary.recent_trend === 'improving' ? 'Improving' :
                     summary.recent_trend === 'declining' ? 'Declining' : 'Stable'}
                  </span>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Rating Breakdown</h4>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = summary.rating_distribution[rating as keyof typeof summary.rating_distribution]
                  const percentage = summary.total_reviews > 0 ? (count / summary.total_reviews) * 100 : 0
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 min-w-[60px]">
                        <span className="text-sm">{rating}</span>
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      </div>
                      <Progress value={percentage} className="flex-1 h-2" />
                      <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[40px]">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Category Ratings */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Category Averages</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Quality</span>
                    <StarRating rating={summary.category_averages.quality} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Value</span>
                    <StarRating rating={summary.category_averages.value} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Communication</span>
                    <StarRating rating={summary.category_averages.communication} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Punctuality</span>
                    <StarRating rating={summary.category_averages.punctuality} />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {summary.verified_reviews_percentage}% verified reviews
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Form Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowReviewForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">Write a Review</h3>
                  <Button variant="ghost" onClick={() => setShowReviewForm(false)}>×</Button>
                </div>

                <div className="space-y-6">
                  {/* Overall Rating */}
                  <div>
                    <Label>Overall Rating *</Label>
                    <StarRating 
                      rating={reviewFormData.overall_rating || 0} 
                      size="lg"
                      onChange={(rating) => handleRatingClick('overall_rating', rating)}
                    />
                  </div>

                  {/* Category Ratings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quality</Label>
                      <StarRating 
                        rating={reviewFormData.quality_rating || 0}
                        onChange={(rating) => handleRatingClick('quality_rating', rating)}
                      />
                    </div>
                    <div>
                      <Label>Value for Money</Label>
                      <StarRating 
                        rating={reviewFormData.value_rating || 0}
                        onChange={(rating) => handleRatingClick('value_rating', rating)}
                      />
                    </div>
                    <div>
                      <Label>Communication</Label>
                      <StarRating 
                        rating={reviewFormData.communication_rating || 0}
                        onChange={(rating) => handleRatingClick('communication_rating', rating)}
                      />
                    </div>
                    <div>
                      <Label>Punctuality</Label>
                      <StarRating 
                        rating={reviewFormData.punctuality_rating || 0}
                        onChange={(rating) => handleRatingClick('punctuality_rating', rating)}
                      />
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <Label htmlFor="review-title">Review Title (Optional)</Label>
                    <Input
                      id="review-title"
                      placeholder="Summarize your experience"
                      value={reviewFormData.title || ''}
                      onChange={(e) => setReviewFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  {/* Review Comment */}
                  <div>
                    <Label htmlFor="review-comment">Your Review *</Label>
                    <Textarea
                      id="review-comment"
                      placeholder="Share your experience in detail"
                      value={reviewFormData.comment || ''}
                      onChange={(e) => setReviewFormData(prev => ({ ...prev, comment: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  {/* Project Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Project Category</Label>
                      <Select 
                        value={reviewFormData.project_category || ''} 
                        onValueChange={(value) => setReviewFormData(prev => ({ ...prev, project_category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web-development">Web Development</SelectItem>
                          <SelectItem value="mobile-app">Mobile App</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Budget Range</Label>
                      <Select 
                        value={reviewFormData.project_budget_range || ''} 
                        onValueChange={(value) => setReviewFormData(prev => ({ ...prev, project_budget_range: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-1000">Under NPR 1,000</SelectItem>
                          <SelectItem value="1000-5000">NPR 1,000 - 5,000</SelectItem>
                          <SelectItem value="5000-10000">NPR 5,000 - 10,000</SelectItem>
                          <SelectItem value="over-10000">Over NPR 10,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={!reviewFormData.overall_rating || !reviewFormData.comment}
                    className="w-full"
                  >
                    Submit Review
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and Search */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest-rated">Highest Rated</SelectItem>
                  <SelectItem value="lowest-rated">Lowest Rated</SelectItem>
                  <SelectItem value="most-helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No reviews found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm || filterRating !== 'all' 
                  ? 'Try adjusting your filters to see more reviews'
                  : 'Be the first to review this service!'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => {
            const isExpanded = expandedReviews.has(review.id)
            const shouldTruncate = review.comment.length > 300

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Review Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={review.user?.avatar || '/placeholder.svg'} />
                            <AvatarFallback className="bg-violet-100 text-violet-800">
                              {review.user?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {review.user?.name || 'Anonymous'}
                              </h4>
                              {review.user?.verified_buyer && (
                                <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                  <Verified className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {review.is_verified_booking && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <StarRating rating={review.overall_rating} />
                              <span className="text-sm text-slate-500">
                                {review.created_at && !isNaN(new Date(review.created_at).getTime()) 
                                  ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) 
                                  : 'Unknown date'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onReportReview?.(review.id)}>
                              <Flag className="h-4 w-4 mr-2" />
                              Report Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Review Title */}
                      {review.title && (
                        <h5 className="font-medium text-slate-900 dark:text-white">
                          {review.title}
                        </h5>
                      )}

                      {/* Review Content */}
                      <div className="space-y-3">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {shouldTruncate && !isExpanded 
                            ? `${review.comment.substring(0, 300)}...`
                            : review.comment
                          }
                        </p>

                        {shouldTruncate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpandedReview(review.id)}
                            className="text-violet-600 hover:text-violet-700"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Read More
                              </>
                            )}
                          </Button>
                        )}

                        {/* Category Ratings */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Quality:</span>
                            <StarRating rating={review.quality_rating} size="sm" />
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Value:</span>
                            <StarRating rating={review.value_rating} size="sm" />
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Communication:</span>
                            <StarRating rating={review.communication_rating} size="sm" />
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Punctuality:</span>
                            <StarRating rating={review.punctuality_rating} size="sm" />
                          </div>
                        </div>

                        {/* Project Details */}
                        {(review.project_category || review.project_budget_range) && (
                          <div className="flex flex-wrap gap-2">
                            {review.project_category && (
                              <Badge variant="outline" className="text-xs">
                                {review.project_category}
                              </Badge>
                            )}
                            {review.project_budget_range && (
                              <Badge variant="outline" className="text-xs">
                                {review.project_budget_range}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Provider Response */}
                      {review.provider_response && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="h-4 w-4 text-violet-600" />
                            <span className="font-medium text-slate-900 dark:text-white">Provider Response</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-sm">
                            {review.provider_response.message}
                          </p>
                          <span className="text-xs text-slate-500 mt-2 block">
                            {review.provider_response.date && !isNaN(new Date(review.provider_response.date).getTime()) 
                              ? formatDistanceToNow(new Date(review.provider_response.date), { addSuffix: true }) 
                              : 'Unknown date'}
                          </span>
                        </div>
                      )}

                      {/* Review Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onHelpfulClick?.(review.id, true)}
                            className="text-slate-600 hover:text-emerald-600"
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Helpful ({review.helpful_count})
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onHelpfulClick?.(review.id, false)}
                            className="text-slate-600 hover:text-red-600"
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            Not Helpful ({review.unhelpful_count})
                          </Button>
                        </div>

                        {review.is_featured && (
                          <Badge className="bg-amber-100 text-amber-800">
                            <Award className="h-3 w-3 mr-1" />
                            Featured Review
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}