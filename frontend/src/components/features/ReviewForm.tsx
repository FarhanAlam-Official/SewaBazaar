/**
 * PHASE 2 NEW COMPONENT: Review Form
 * 
 * Purpose: Form for creating and editing reviews
 * Impact: New component - enables gated review creation
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InteractiveStarRating } from '@/components/ui/star-rating';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { showToast } from '@/components/ui/enhanced-toast';
import type { 
  CreateReviewRequest, 
  UpdateReviewRequest, 
  EligibleBooking, 
  Review 
} from '@/types/provider';

interface ReviewFormProps {
  providerId: number;
  providerName: string;
  eligibleBookings?: EligibleBooking[];
  existingReview?: Review;
  onSubmit: (data: CreateReviewRequest | UpdateReviewRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormData {
  booking_id?: number;
  rating: number;
  comment: string;
}

interface FormErrors {
  booking_id?: string;
  rating?: string;
  comment?: string;
  general?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  providerId,
  providerName,
  eligibleBookings = [],
  existingReview,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const isEditing = !!existingReview;
  
  const [formData, setFormData] = useState<FormData>({
    booking_id: eligibleBookings.length === 1 ? eligibleBookings[0].id : undefined,
    rating: existingReview?.rating || 0,
    comment: existingReview?.comment || ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValid, setIsValid] = useState(false);

  // Validate form
  React.useEffect(() => {
    const newErrors: FormErrors = {};
    
    if (!isEditing && !formData.booking_id) {
      newErrors.booking_id = 'Please select a booking';
    }
    
    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!formData.comment.trim()) {
      newErrors.comment = 'Please write a comment';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters long';
    } else if (formData.comment.length > 1000) {
      newErrors.comment = 'Comment cannot exceed 1000 characters';
    }
    
    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }, [formData, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || isSubmitting) return;
    
    try {
      const submitData = isEditing 
        ? { rating: formData.rating, comment: formData.comment.trim() }
        : { 
            booking_id: formData.booking_id!, 
            rating: formData.rating, 
            comment: formData.comment.trim() 
          };
      
      await onSubmit(submitData);
      showToast.success({
        title: "Review Success",
        description: isEditing ? 'Review updated successfully!' : 'Review submitted successfully!',
        duration: 4000
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to submit review' 
      });
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatBookingOption = (booking: EligibleBooking) => {
    const date = new Date(booking.booking_date).toLocaleDateString();
    const amount = parseFloat(booking.total_amount).toLocaleString();
    return `${booking.service__title} - ${date} (NPR ${amount})`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? 'Edit Review' : 'Write a Review'}
        </CardTitle>
        <p className="text-gray-600">
          {isEditing ? `Update your review for ${providerName}` : `Share your experience with ${providerName}`}
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Selection (only for new reviews) */}
          {!isEditing && eligibleBookings.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="booking">Select Booking *</Label>
              <Select
                value={formData.booking_id?.toString()}
                onValueChange={(value) => updateFormData('booking_id', parseInt(value))}
              >
                <SelectTrigger className={errors.booking_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Choose which booking to review" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleBookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id.toString()}>
                      {formatBookingOption(booking)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.booking_id && (
                <p className="text-red-500 text-sm">{errors.booking_id}</p>
              )}
            </div>
          )}

          {/* Single booking display */}
          {!isEditing && eligibleBookings.length === 1 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-gray-700">Booking Details</Label>
              <p className="text-sm text-gray-600 mt-1">
                {formatBookingOption(eligibleBookings[0])}
              </p>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <InteractiveStarRating
              value={formData.rating}
              onChange={(rating) => updateFormData('rating', rating)}
              error={errors.rating}
              required
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this provider. What did you like? How was the service quality?"
              value={formData.comment}
              onChange={(e) => updateFormData('comment', e.target.value)}
              className={errors.comment ? 'border-red-500' : ''}
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{errors.comment && <span className="text-red-500">{errors.comment}</span>}</span>
              <span>{formData.comment.length}/1000</span>
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          {/* Edit Window Warning */}
          {isEditing && existingReview?.can_edit && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                You can edit this review within 24 hours of posting.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Review' : 'Submit Review'}
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};