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
  className 
}: VoucherSkeletonProps) {
  return (
    <Card className={cn("w-full bg-white dark:bg-card", className)}>
      {/* Header Skeleton */}
      <CardHeader className="pb-4 pt-4 px-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-36 rounded-md" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-6 px-5">
        {/* Value Information Skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-card/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <Skeleton className="h-8 w-20 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
          <div className="text-center p-4 bg-primary/5 dark:bg-card/50 rounded-lg border border-primary/20 dark:border-gray-700">
            <Skeleton className="h-8 w-20 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        </div>

        {/* Usage Status Skeleton */}
        <div className="mb-6 min-h-[56px] flex flex-col justify-center bg-gray-50/50 dark:bg-card/30 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto mt-1" />
        </div>

        {/* Actions Skeleton - Pyramid layout */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Skeleton className="h-10 w-full mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}