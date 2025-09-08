import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function PaymentLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          </div>
          
          <div className="mb-2">
            <div className="h-8 w-64 bg-muted rounded mb-2 animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Section Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-40 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {/* Image Skeleton */}
                  <div className="relative w-20 h-20 rounded-lg bg-muted animate-pulse flex-shrink-0" />
                  
                  {/* Content Skeleton */}
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Payment Method Options Skeleton */}
                {[1, 2, 3].map((item) => (
                  <div key={item} className="rounded-xl border-2 border-border p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                          {item === 1 && <div className="h-5 w-16 bg-muted rounded animate-pulse" />}
                        </div>
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Details Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-36 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-muted animate-pulse" />
                  <div className="h-6 w-48 bg-muted rounded mx-auto animate-pulse" />
                  <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
                  <div className="h-12 w-48 bg-muted rounded mx-auto animate-pulse" />
                </div>
              </CardContent>
            </Card>

            {/* Service Delivery Process Card Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-52 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted animate-pulse mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-full bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Card Skeleton */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Breakdown Skeleton */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between">
                    <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-28 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                
                {/* Secure Payment Info Skeleton */}
                <div className="rounded-xl border p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-full bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                
                {/* Features List Skeleton */}
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
                      <div className="h-3 w-full bg-muted rounded animate-pulse" />
                    </div>
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