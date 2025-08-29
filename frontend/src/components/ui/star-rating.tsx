/**
 * PHASE 2 NEW COMPONENT: Star Rating Display and Input
 * 
 * Purpose: Display and input star ratings for reviews
 * Impact: New UI component - supports review rating functionality
 */

'use client';

import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  className,
  interactive = false,
  onRatingChange
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;
  const filled = Math.floor(displayRating);
  const hasHalf = displayRating % 1 >= 0.5;
  const empty = maxRating - filled - (hasHalf ? 1 : 0);

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (interactive) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div 
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
      >
        {/* Filled stars */}
        {Array.from({ length: filled }, (_, i) => (
          <Star
            key={`filled-${i}`}
            className={cn(
              sizeClasses[size],
              'fill-yellow-400 text-yellow-400',
              interactive && 'cursor-pointer hover:scale-110 transition-transform'
            )}
            onClick={() => handleStarClick(i + 1)}
            onMouseEnter={() => handleStarHover(i + 1)}
          />
        ))}
        
        {/* Half star */}
        {hasHalf && (
          <div className="relative">
            <Star
              className={cn(
                sizeClasses[size],
                'text-gray-300',
                interactive && 'cursor-pointer hover:scale-110 transition-transform'
              )}
              onClick={() => handleStarClick(filled + 1)}
              onMouseEnter={() => handleStarHover(filled + 1)}
            />
            <StarHalf
              className={cn(
                sizeClasses[size],
                'absolute inset-0 fill-yellow-400 text-yellow-400',
                interactive && 'cursor-pointer hover:scale-110 transition-transform pointer-events-none'
              )}
            />
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: empty }, (_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(
              sizeClasses[size],
              'text-gray-300',
              interactive && 'cursor-pointer hover:scale-110 transition-transform hover:text-yellow-400'
            )}
            onClick={() => handleStarClick(filled + (hasHalf ? 1 : 0) + i + 1)}
            onMouseEnter={() => handleStarHover(filled + (hasHalf ? 1 : 0) + i + 1)}
          />
        ))}
      </div>
      
      {showValue && (
        <span className={cn('text-gray-600 ml-1', textSizeClasses[size])}>
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

interface InteractiveStarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  required?: boolean;
  error?: string;
}

export const InteractiveStarRating: React.FC<InteractiveStarRatingProps> = ({
  value,
  onChange,
  size = 'lg',
  className,
  required = false,
  error
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <StarRating
          rating={value}
          size={size}
          interactive
          onRatingChange={onChange}
        />
        <span className="text-sm text-gray-600">
          {value > 0 ? `${value} star${value !== 1 ? 's' : ''}` : 'Select rating'}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </div>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

interface RatingBreakdownProps {
  breakdown: Record<number, number>;
  totalReviews: number;
  className?: string;
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  breakdown,
  totalReviews,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = breakdown[rating] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        return (
          <div key={rating} className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 w-12">
              <span>{rating}</span>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
            
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <span className="text-gray-600 w-8 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
};