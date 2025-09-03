/**
 * PHASE 2 NEW COMPONENT: Rating Summary
 * 
 * Purpose: Display rating statistics and breakdown
 * Impact: New component - shows provider rating analytics
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating, RatingBreakdown } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { providerUtils } from '@/services/providerService';
import type { RatingSummary } from '@/types/provider';

interface RatingSummaryProps {
  ratingSummary: RatingSummary;
  className?: string;
  showBreakdown?: boolean;
  showTrend?: boolean;
  trend?: 'improving' | 'declining' | 'stable' | 'no_data';
}

export const RatingSummaryComponent: React.FC<RatingSummaryProps> = ({
  ratingSummary,
  className,
  showBreakdown = true,
  showTrend = false,
  trend
}) => {
  const { average, count, breakdown } = ratingSummary;
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'improving':
        return 'Improving';
      case 'declining':
        return 'Declining';
      case 'stable':
        return 'Stable';
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'improving':
        return 'bg-green-100 text-green-800';
      case 'declining':
        return 'bg-red-100 text-red-800';
      case 'stable':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (count === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <div className="text-gray-400">
              <StarRating rating={0} size="lg" />
            </div>
            <p className="text-gray-500">No reviews yet</p>
            <p className="text-sm text-gray-400">
              Be the first to leave a review!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Customer Reviews</span>
          {showTrend && trend && getTrendText() && (
            <Badge variant="secondary" className={getTrendColor()}>
              {getTrendIcon()}
              <span className="ml-1">{getTrendText()}</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {providerUtils.formatRating(average)}
            </div>
            <StarRating rating={average} size="lg" />
            <p className="text-sm text-gray-600 mt-2">
              {count} review{count !== 1 ? 's' : ''}
            </p>
          </div>
          
          {showBreakdown && (
            <div className="flex-1">
              <RatingBreakdown 
                breakdown={breakdown} 
                totalReviews={count}
              />
            </div>
          )}
        </div>

        {/* Rating Distribution Summary */}
        {showBreakdown && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">
                {((breakdown[5] + breakdown[4]) / count * 100).toFixed(0)}%
              </div>
              <p className="text-sm text-gray-600">Positive (4-5 stars)</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-600">
                {(breakdown[5] / count * 100).toFixed(0)}%
              </div>
              <p className="text-sm text-gray-600">Excellent (5 stars)</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CompactRatingSummaryProps {
  ratingSummary: RatingSummary;
  className?: string;
}

export const CompactRatingSummary: React.FC<CompactRatingSummaryProps> = ({
  ratingSummary,
  className
}) => {
  const { average, count } = ratingSummary;

  if (count === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StarRating rating={0} size="sm" />
        <span className="text-sm text-gray-500">No reviews</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StarRating rating={average} size="sm" showValue />
      <span className="text-sm text-gray-600">
        ({count} review{count !== 1 ? 's' : ''})
      </span>
    </div>
  );
};

interface RatingBadgeProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  count,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const colorClass = providerUtils.getRatingColor(rating);

  return (
    <Badge 
      variant="secondary" 
      className={`${sizeClasses[size]} ${colorClass} bg-white border ${className}`}
    >
      ⭐ {providerUtils.formatRating(rating)}
      {count && <span className="ml-1">({count})</span>}
    </Badge>
  );
};