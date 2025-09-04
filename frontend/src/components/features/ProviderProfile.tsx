/**
 * PHASE 2 NEW COMPONENT: Provider Profile Page Component
 * 
 * Purpose: Public provider profile with reviews and portfolio
 * Impact: New component - provides public access to provider information
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Calendar, 
  Award, 
  Briefcase, 
  Star, 
  MessageSquare,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { showToast } from '@/components/ui/enhanced-toast';

import { ProviderService, providerUtils } from '@/services/providerService';
import { RatingSummaryComponent } from './RatingSummary';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';

import type { 
  ProviderProfile, 
  Review, 
  ReviewEligibility, 
  CreateReviewRequest,
  UpdateReviewRequest
} from '@/types/provider';

interface ProviderProfileProps {
  providerId: number;
  user?: any;
  isAuthenticated: boolean;
}

export const ProviderProfileComponent: React.FC<ProviderProfileProps> = ({
  providerId,
  user,
  isAuthenticated
}) => {
  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const pageSize = 10;
  
  // Modal states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewFormLoading, setReviewFormLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load provider profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const profileData = await ProviderService.getProviderProfile(providerId);
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading provider profile:', error);
        setError('Failed to load provider profile');
      } finally {
        setProfileLoading(false);
      }
    };

    if (providerId) {
      loadProfile();
    }
  }, [providerId]);

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        const reviewsData = await ProviderService.getProviderReviews(providerId, {
          page: currentPage,
          page_size: pageSize,
          rating: selectedRating || undefined
        });
        
        setReviews(reviewsData.results);
        setTotalReviews(reviewsData.count);
      } catch (error) {
        console.error('Error loading reviews:', error);
        showToast.error({
          title: "Reviews Error",
          description: "Failed to load reviews",
          duration: 5000
        });
      } finally {
        setReviewsLoading(false);
      }
    };

    if (providerId) {
      loadReviews();
    }
  }, [providerId, currentPage, selectedRating]);

  // Check review eligibility for authenticated users
  useEffect(() => {
    const checkEligibility = async () => {
      if (!isAuthenticated || !user || user.role !== 'customer') {
        return;
      }

      try {
        const eligibilityData = await ProviderService.checkReviewEligibility(providerId);
        setEligibility(eligibilityData);
      } catch (error) {
        console.error('Error checking review eligibility:', error);
      }
    };

    if (providerId && isAuthenticated) {
      checkEligibility();
    }
  }, [providerId, isAuthenticated, user]);

  // Handle review submission
  const handleReviewSubmit = async (data: CreateReviewRequest | UpdateReviewRequest) => {
    try {
      setReviewFormLoading(true);
      
      if (editingReview) {
        // Update existing review
        await ProviderService.updateReview(editingReview.id, data as UpdateReviewRequest);
        
        // Update the review in the list
        setReviews(prev => prev.map(review => 
          review.id === editingReview.id 
            ? { ...review, ...data, is_edited: true }
            : review
        ));
      } else {
        // Create new review
        const newReview = await ProviderService.createReview(providerId, data as CreateReviewRequest);
        
        // Add to the beginning of the list
        setReviews(prev => [newReview, ...prev]);
        setTotalReviews(prev => prev + 1);
        
        // Update eligibility
        if (eligibility) {
          setEligibility({
            ...eligibility,
            eligible: false,
            reason: 'You have already reviewed this provider'
          });
        }
      }
      
      // Close form
      setShowReviewForm(false);
      setEditingReview(null);
      
      // Refresh profile to update rating summary
      const updatedProfile = await ProviderService.getProviderProfile(providerId);
      setProfile(updatedProfile);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error; // Let the form handle the error
    } finally {
      setReviewFormLoading(false);
    }
  };

  // Handle review edit
  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  // Handle review delete
  const handleDeleteReview = async (review: Review) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await ProviderService.deleteReview(review.id);
      
      // Remove from list
      setReviews(prev => prev.filter(r => r.id !== review.id));
      setTotalReviews(prev => prev - 1);
      
      // Refresh profile to update rating summary
      const updatedProfile = await ProviderService.getProviderProfile(providerId);
      setProfile(updatedProfile);
      
      showToast.success({
        title: "Review Deleted",
        description: "Review deleted successfully",
        duration: 3000
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      showToast.error({
        title: "Delete Failed",
        description: "Failed to delete review",
        duration: 5000
      });
    }
  };

  // Handle write review button click
  const handleWriteReview = () => {
    if (!isAuthenticated) {
      showToast.error({
        title: "Login Required",
        description: "Please log in to write a review",
        duration: 4000
      });
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'customer') {
      showToast.error({
        title: "Access Denied",
        description: "Only customers can write reviews",
        duration: 4000
      });
      return;
    }

    if (!eligibility?.eligible) {
      showToast.error({
        title: "Review Not Allowed",
        description: eligibility?.reason || 'You are not eligible to review this provider',
        duration: 5000
      });
      return;
    }

    setEditingReview(null);
    setShowReviewForm(true);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading provider profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Provider Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || 'The provider profile you are looking for does not exist.'}
            </p>
            <Button onClick={() => router.push('/')}>
              Go Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Provider Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.profile_picture} alt={profile.display_name} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Provider Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                      {profile.is_verified && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                      {profile.location_city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.location_city}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{providerUtils.formatExperience(profile.years_of_experience)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{profile.total_services} service{profile.total_services !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    {/* Rating Summary */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xl font-semibold">
                          {providerUtils.formatRating(profile.rating_summary.average)}
                        </span>
                        <span className="text-gray-600">
                          ({profile.rating_summary.count} review{profile.rating_summary.count !== 1 ? 's' : ''})
                        </span>
                      </div>
                      
                      <div className="text-gray-600">
                        • {profile.total_bookings} booking{profile.total_bookings !== 1 ? 's' : ''} completed
                      </div>
                    </div>
                    
                    {/* Service Categories */}
                    {profile.service_categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profile.service_categories.map((category) => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Write Review Button */}
                  {isAuthenticated && user?.role === 'customer' && (
                    <Button
                      onClick={handleWriteReview}
                      disabled={!eligibility?.eligible}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Write Review
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eligibility Message */}
        {isAuthenticated && user?.role === 'customer' && eligibility && !eligibility.eligible && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {eligibility.reason}
            </AlertDescription>
          </Alert>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({profile.rating_summary.count})
            </TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bio */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {profile.bio || 'No bio available.'}
                  </p>
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.certifications.length > 0 ? (
                    <ul className="space-y-2">
                      {profile.certifications.map((cert, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span>{cert}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No certifications listed.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Rating Summary */}
            <RatingSummaryComponent 
              ratingSummary={profile.rating_summary}
              showBreakdown
            />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <ReviewList
              reviews={reviews}
              totalCount={totalReviews}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onRatingFilter={setSelectedRating}
              selectedRating={selectedRating}
              isLoading={reviewsLoading}
              showActions={isAuthenticated && user?.role === 'customer'}
              onEditReview={handleEditReview}
              onDeleteReview={handleDeleteReview}
              currentUserId={user?.id}
            />
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.portfolio_media.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profile.portfolio_media.map((media) => (
                      <div key={media.id} className="space-y-2">
                        {media.media_type === 'image' ? (
                          <img
                            src={media.file_url}
                            alt={media.title || 'Portfolio item'}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={media.file_url}
                            controls
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        )}
                        {media.title && (
                          <h4 className="font-medium">{media.title}</h4>
                        )}
                        {media.description && (
                          <p className="text-sm text-gray-600">{media.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No portfolio items available.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">
                  Service listings will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Review Form Modal */}
        <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReview ? 'Edit Review' : 'Write a Review'}
              </DialogTitle>
            </DialogHeader>
            
            <ReviewForm
              providerId={providerId}
              providerName={profile.display_name}
              eligibleBookings={eligibility?.eligible_bookings}
              existingReview={editingReview || undefined}
              onSubmit={handleReviewSubmit}
              onCancel={() => {
                setShowReviewForm(false);
                setEditingReview(null);
              }}
              isSubmitting={reviewFormLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};