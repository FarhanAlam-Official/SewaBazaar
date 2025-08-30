import { Loader2, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          
          <div className="text-center">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2 animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
          </div>
        </div>

        {/* Service Summary Card Skeleton */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Skeleton */}
              <div className="flex-shrink-0">
                <div className="w-full md:w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>

              {/* Content Skeleton */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                    <div className="space-y-2 mb-3">
                      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Price Skeleton */}
                  <div className="text-right">
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Wizard Skeleton */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="relative mb-6">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                    <CreditCard className="h-6 w-6 text-blue-400 absolute -bottom-1 -right-1 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Preparing Your Booking
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Setting up the booking wizard for you...
                  </p>
                  
                  {/* Progress Steps Skeleton */}
                  <div className="flex justify-center space-x-2 mt-6">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                          ${step === 1 
                            ? 'bg-blue-600 text-white animate-pulse' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                          }`}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Step 1 of 5: Service Details
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}