import { Skeleton } from "@/components/ui/skeleton"

interface TimeSlotSkeletonProps {
  count?: number
  variant?: 'booking-page' | 'service-section'
}

export function TimeSlotSkeleton({ count = 12, variant = 'booking-page' }: TimeSlotSkeletonProps) {
  if (variant === 'service-section') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton 
            key={index} 
            className="h-16 rounded-lg bg-slate-200/80 dark:bg-slate-700/80" 
          />
        ))}
      </div>
    )
  }

  // Default booking-page variant
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="p-5 rounded-lg border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 min-h-[100px]"
        >
          <div className="flex flex-col items-start space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-3 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}