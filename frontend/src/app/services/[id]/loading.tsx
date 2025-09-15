import { Skeleton } from "@/components/ui/skeleton"

export default function ServiceDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Simple Back Button Skeleton */}
        <Skeleton className="h-10 w-40 mb-4" />
        
        {/* Live Activity Banner Skeleton */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border border-emerald-200/50 dark:border-emerald-700/50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>

        {/* Hero Section Skeleton */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Image and Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative">
              <Skeleton className="h-96 w-full rounded-2xl" />
              {/* Image overlay badges */}
              <div className="absolute top-4 left-4 space-y-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              {/* Image controls */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
            
            {/* Gallery Thumbnails */}
            <div className="flex gap-2 overflow-x-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Right Side - Service Info */}
          <div className="space-y-6">
            {/* Title and Rating */}
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <div className="flex items-center space-x-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-4 w-4" />
                  ))}
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Quick Booking Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Description Section Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 space-y-6">
          <Skeleton className="h-7 w-48" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          
          {/* Features list skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="grid md:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Pricing Section Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-7 w-40 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`relative border-2 rounded-2xl p-6 space-y-4 ${i === 2 ? 'border-purple-200 bg-purple-50/50 dark:border-purple-700 dark:bg-purple-950/20' : 'border-slate-200 dark:border-slate-700'}`}>
                {/* Popular badge for middle card */}
                {i === 2 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                )}
                
                <div className="text-center space-y-2">
                  <Skeleton className="h-6 w-20 mx-auto" />
                  <div className="flex items-baseline justify-center gap-1">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
                
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
                
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Provider Section Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 space-y-6">
          <Skeleton className="h-7 w-48" />
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Provider Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-4 w-4" />
                    ))}
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
              
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              
              <div className="flex gap-3">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            
            {/* Provider Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center space-y-2">
                  <Skeleton className="h-8 w-16 mx-auto" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Reviews Section Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Reviews Summary */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Skeleton className="h-12 w-16 mx-auto" />
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-5 w-5" />
                  ))}
                </div>
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            </div>
            
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Review Filters */}
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          
          {/* Individual Reviews */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-slate-200 dark:border-slate-700 pb-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <Skeleton key={j} className="h-4 w-4" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Enhanced Call to Action Section Skeleton */}
        <div className="bg-gradient-to-br from-violet-50 via-blue-50/50 to-indigo-50/40 dark:from-violet-950/20 dark:via-blue-950/10 dark:to-indigo-950/20 rounded-3xl p-8 border border-violet-200/50 dark:border-violet-700/50 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-5 w-80" />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-14 w-64" />
                <div className="flex gap-2">
                  <Skeleton className="h-14 w-14" />
                  <Skeleton className="h-14 w-14" />
                  <Skeleton className="h-14 w-14" />
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}