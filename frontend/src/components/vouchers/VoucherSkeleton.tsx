/**
 * VoucherSkeleton Component
 * 
 * Loading skeleton for voucher cards
 * Matches the structure of VoucherCard for smooth loading experience
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface VoucherSkeletonProps {
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export function VoucherSkeleton({ 
  variant = 'default', 
  className 
}: VoucherSkeletonProps) {
  if (variant === 'compact') {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-3 h-3 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      {/* Header Skeleton */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-32 rounded-md" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-6">
        {/* Value Information Skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        </div>

        {/* Progress Skeleton */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-32 mt-1" />
        </div>

        {/* Points Information Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Dates Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="flex items-center">
            <Skeleton className="w-4 h-4 mr-2" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center">
            <Skeleton className="w-4 h-4 mr-2" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>

        {/* Actions Skeleton */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 flex-1 min-w-[120px]" />
          <Skeleton className="h-9 flex-1 min-w-[100px]" />
          <Skeleton className="h-9 flex-1 min-w-[100px]" />
        </div>
      </CardContent>
    </Card>
  )
}
