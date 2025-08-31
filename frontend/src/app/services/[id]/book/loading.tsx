import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ServiceBookingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8 text-center space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Service Summary Card Skeleton */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Skeleton */}
              <div className="flex-shrink-0">
                <Skeleton className="w-full md:w-48 h-32 rounded-lg" />
              </div>

              {/* Content Skeleton */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>

                  {/* Price Skeleton */}
                  <div className="text-right">
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Express Mode Toggle Skeleton */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Booking Form Skeleton */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Date & Time Selection Skeleton */}
              <div className="space-y-6">
                {/* Slot Type Filter Skeleton */}
                <div>
                  <Skeleton className="h-5 w-40 mb-4" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                    {Array(4).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-8 rounded-md" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-64" />
                </div>
                
                {/* Calendar Skeleton */}
                <div>
                  <Skeleton className="h-5 w-32 mb-4" />
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-6" />
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array(7).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-6" />
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array(35).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-8 rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Time Slots Skeleton */}
                <div>
                  <Skeleton className="h-5 w-64 mb-4" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array(6).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Service Details Skeleton */}
              <div className="space-y-6">
                <Skeleton className="h-5 w-40" />
                
                <div className="space-y-4">
                  {/* Address Field Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 rounded-md" />
                  </div>

                  {/* City and Phone Fields Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 rounded-md" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 rounded-md" />
                    </div>
                  </div>

                  {/* Special Instructions Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-16 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Summary Skeleton */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="border-t my-2"></div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-12 font-bold" />
                <Skeleton className="h-5 w-28 font-bold" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons Skeleton */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 rounded-lg" />
          <div className="flex items-center justify-center gap-4">
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}