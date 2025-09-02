import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TimeSlotSkeleton } from "@/components/services/TimeSlotSkeleton"

export default function ServiceBookingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <Skeleton className="h-4 w-32 bg-slate-200/80 dark:bg-slate-700/80" />
              </div>
            </div>
            
            <div className="text-center">
              <Skeleton className="h-6 w-48 mx-auto bg-slate-200/80 dark:bg-slate-700/80" />
              <Skeleton className="h-4 w-64 mt-1 mx-auto bg-slate-200/80 dark:bg-slate-700/80" />
            </div>
            
            <div className="w-32"> {/* Spacer for centering */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Service Summary Card Skeleton */}
          <Card className="mb-8 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Booking Steps */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Slot Type Filter Skeleton */}
                  <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                    <Skeleton className="h-6 w-40 mb-4 bg-slate-200/80 dark:bg-slate-700/80" />
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                      {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg bg-slate-200/80 dark:bg-slate-700/80" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-full bg-slate-200/80 dark:bg-slate-700/80" />
                  </div>

                  {/* Calendar Skeleton */}
                  <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                    <Skeleton className="h-6 w-32 mb-4 bg-slate-200/80 dark:bg-slate-700/80" />
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
                        <Skeleton className="h-6 w-6 bg-slate-200/80 dark:bg-slate-700/80" />
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array(7).fill(0).map((_, i) => (
                          <Skeleton key={i} className="h-6 bg-slate-200/80 dark:bg-slate-700/80" />
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array(35).fill(0).map((_, i) => (
                          <Skeleton key={i} className="h-8 rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Service Details Skeleton */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                    <Skeleton className="h-6 w-40 mb-6 bg-slate-200/80 dark:bg-slate-700/80" />
                    
                    <div className="space-y-4">
                      {/* Address Field Skeleton */}
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
                        <Skeleton className="h-20 rounded-md bg-slate-200/80 dark:bg-slate-700/80" />
                      </div>

                      {/* City and Phone Fields Skeleton */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-16 bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-10 rounded-md bg-slate-200/80 dark:bg-slate-700/80" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-10 rounded-md bg-slate-200/80 dark:bg-slate-700/80" />
                        </div>
                      </div>

                      {/* Special Instructions Skeleton */}
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40 bg-slate-200/80 dark:bg-slate-700/80" />
                        <Skeleton className="h-16 rounded-md bg-slate-200/80 dark:bg-slate-700/80" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Slots Section Skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32 bg-slate-200/80 dark:bg-slate-700/80" />
              <Skeleton className="h-4 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
            </div>
            
            <TimeSlotSkeleton count={12} />
          </div>

          {/* Price Summary Skeleton */}
          <Card className="mb-8 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 border-violet-200/50 dark:border-violet-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <Skeleton className="h-6 w-40 bg-slate-200/80 dark:bg-slate-700/80" />
                <Skeleton className="h-6 w-6 rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-violet-200/50 dark:border-violet-700/50">
                  <Skeleton className="h-4 w-20 bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="h-4 w-32 bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-violet-200/50 dark:border-violet-700/50">
                  <Skeleton className="h-4 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="h-4 w-40 bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-violet-200/50 dark:border-violet-700/50">
                  <Skeleton className="h-4 w-20 bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="h-4 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-5 w-12 font-bold bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="h-5 w-28 font-bold bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons Skeleton */}
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 rounded-xl bg-slate-200/80 dark:bg-slate-700/80" />
            <div className="flex items-center justify-center gap-4">
              <Skeleton className="h-10 w-40 rounded-md bg-slate-200/80 dark:bg-slate-700/80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}