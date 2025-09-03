import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ServiceDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-4 w-48 bg-slate-200/80 dark:bg-slate-700/80" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section Skeleton */}
            <Card className="overflow-hidden">
              <div className="relative h-96">
                <Skeleton className="w-full h-full bg-slate-200/80 dark:bg-slate-700/80" />
              </div>
              <CardHeader className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4 bg-slate-200/80 dark:bg-slate-700/80" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32 bg-slate-200/80 dark:bg-slate-700/80" />
                    <Skeleton className="h-4 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Description Section Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-4 bg-slate-200/80 dark:bg-slate-700/80" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="h-4 w-full bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="h-4 w-3/4 bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
              </CardContent>
            </Card>

            {/* Pricing Section Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-40 mb-6 bg-slate-200/80 dark:bg-slate-700/80" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="p-4 bg-slate-100 dark:bg-slate-800">
                        <Skeleton className="h-5 w-32 bg-slate-200/80 dark:bg-slate-700/80" />
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <Skeleton className="h-8 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-4 w-full bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-4 w-5/6 bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-4 w-4/6 bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-10 w-full mt-4 bg-slate-200/80 dark:bg-slate-700/80" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-6 bg-slate-200/80 dark:bg-slate-700/80" />
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-32 bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-4 w-16 bg-slate-200/80 dark:bg-slate-700/80" />
                        </div>
                        <div className="flex space-x-1">
                          {Array(5).fill(0).map((_, j) => (
                            <Skeleton key={j} className="h-4 w-4 bg-slate-200/80 dark:bg-slate-700/80" />
                          ))}
                        </div>
                        <Skeleton className="h-4 w-full bg-slate-200/80 dark:bg-slate-700/80" />
                        <Skeleton className="h-4 w-3/4 bg-slate-200/80 dark:bg-slate-700/80" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Provider Section Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-16 w-16 rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 bg-slate-200/80 dark:bg-slate-700/80" />
                    <Skeleton className="h-4 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 bg-slate-200/80 dark:bg-slate-700/80" />
                    <Skeleton className="h-4 w-20 bg-slate-200/80 dark:bg-slate-700/80" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 bg-slate-200/80 dark:bg-slate-700/80" />
                    <Skeleton className="h-4 w-32 bg-slate-200/80 dark:bg-slate-700/80" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 bg-slate-200/80 dark:bg-slate-700/80" />
                    <Skeleton className="h-4 w-24 bg-slate-200/80 dark:bg-slate-700/80" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-10 flex-1 bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="h-10 flex-1 bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
              </CardContent>
            </Card>

            {/* Booking Section Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4 bg-slate-200/80 dark:bg-slate-700/80" />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16 bg-slate-200/80 dark:bg-slate-700/80" />
                      <Skeleton className="h-10 bg-slate-200/80 dark:bg-slate-700/80" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16 bg-slate-200/80 dark:bg-slate-700/80" />
                      <Skeleton className="h-10 bg-slate-200/80 dark:bg-slate-700/80" />
                    </div>
                  </div>
                  <Skeleton className="h-20 bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="h-12 bg-slate-200/80 dark:bg-slate-700/80" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}