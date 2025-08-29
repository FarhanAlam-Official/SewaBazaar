/**
 * PHASE 2 NEW COMPONENT: Review List
 * 
 * Purpose: Display paginated list of reviews with filtering
 * Impact: New component - shows provider reviews on public profiles
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarRating } from '@/components/ui/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Filter, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { providerUtils } from '@/services/providerService';
import type { Review, ReviewsResponse } from '@/types/provider';

interface ReviewListProps {
  reviews: Review[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRatingFilter: (rating: number | null) => void;
  selectedRating?: number | null;
  isLoading?: boolean;
  showActions?: boolean;
  onEditReview?: (review: Review) => void;
  onDeleteReview?: (review: Review) => void;
  currentUserId?: number;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onRatingFilter,
  selectedRating,
  isLoading = false,
  showActions = false,
  onEditReview,
  onDeleteReview,
  currentUserId
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handleRatingFilter = (value: string) => {
    if (value === 'all') {
      onRatingFilter(null);
    } else {
      onRatingFilter(parseInt(value));
    }
  };

  const canEditReview = (review: Review): boolean => {
    return showActions && 
           currentUserId === review.customer.id && 
           review.can_edit;
  };

  const canDeleteReview = (review: Review): boolean => {
    return showActions && 
           currentUserId === review.customer.id && 
           review.can_delete;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading reviews...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">Filter by rating:</span>
        </div>
        
        <Select value={selectedRating?.toString() || 'all'} onValueChange={handleRatingFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
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
        
        <span className="text-sm text-gray-500">
          {totalCount} review{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">
              {selectedRating 
                ? `No ${selectedRating}-star reviews found.`
                : 'No reviews yet. Be the first to leave a review!'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Customer Avatar */}
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>
                      {review.customer.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.customer.display_name}</span>
                          {review.is_edited && (
                            <Badge variant="secondary" className="text-xs">
                              Edited
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-sm text-gray-500">
                            {providerUtils.formatReviewDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      {showActions && (canEditReview(review) || canDeleteReview(review)) && (
                        <div className="flex items-center gap-2">
                          {canEditReview(review) && onEditReview && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditReview(review)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {canDeleteReview(review) && onDeleteReview && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteReview(review)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Service Info */}
                    <div className="text-sm text-gray-600">
                      Service: <span className="font-medium">{review.service_title}</span>
                      {review.booking_date && (
                        <span className="ml-2">
                          • {new Date(review.booking_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {/* Review Comment */}
                    <p className="text-gray-700 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} reviews
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};