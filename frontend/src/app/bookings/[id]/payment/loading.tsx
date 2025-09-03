import { Loader2, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function PaymentLoading() {
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Section Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary Card Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Image Skeleton */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </div>
                  
                  {/* Content Skeleton */}
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Card Skeleton */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                
                {/* Payment Method Options Skeleton */}
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </CardContent>
            </Card>

            {/* Payment Details Card Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center min-h-[200px]">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                      <CreditCard className="h-6 w-6 text-blue-400 absolute -bottom-1 -right-1 animate-pulse" />
                    </div>
                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2 animate-pulse" />
                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Card Skeleton */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                
                {/* Price Breakdown Skeleton */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                
                {/* Secure Payment Info Skeleton */}
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                
                {/* Features List Skeleton */}
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}