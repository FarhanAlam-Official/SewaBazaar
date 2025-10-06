import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 border-r">
            <div className="p-4 space-y-4">
              <Skeleton className="h-10 w-40" />
              <div className="space-y-2">
                {[0,1,2,3,4].map((i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-md" />
                ))}
              </div>
              <div className="pt-2 space-y-2">
                <Skeleton className="h-4 w-24" />
                {[0,1,2].map((i) => (
                  <Skeleton key={i} className="h-7 w-11/12 rounded" />
                ))}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6 md:p-8">
            <div className="space-y-8">
              {/* Top bar */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-9 w-64" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-28 rounded-md" />
                  <Skeleton className="h-10 w-28 rounded-md" />
                </div>
              </div>

              {/* KPI / Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[0,1,2,3].map((i) => (
                  <Card key={i} className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                      <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-full rounded" />
                  </Card>
                ))}
              </div>

              {/* Content area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-40" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24 rounded-md" />
                      <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-72 w-full rounded-lg" />
                </Card>
                <Card className="p-6 space-y-4">
                  <Skeleton className="h-6 w-40" />
                  {[0,1,2,3,4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-12 rounded" />
                    </div>
                  ))}
                </Card>
              </div>

              {/* Table section */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-3">
                  <Skeleton className="col-span-3 h-4" />
                  <Skeleton className="col-span-3 h-4" />
                  <Skeleton className="col-span-2 h-4" />
                  <Skeleton className="col-span-2 h-4" />
                  <Skeleton className="col-span-2 h-4" />
                </div>
                <div className="divide-y rounded-md border">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="grid grid-cols-12 items-center gap-3 p-4">
                      <Skeleton className="col-span-3 h-4" />
                      <Skeleton className="col-span-3 h-4" />
                      <Skeleton className="col-span-2 h-4" />
                      <Skeleton className="col-span-2 h-4" />
                      <Skeleton className="col-span-2 h-8 rounded-md" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-28" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardSkeleton

