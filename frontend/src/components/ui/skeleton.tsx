import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "avatar" | "title" | "text"
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/80",
        {
          "h-4 w-full": variant === "text",
          "h-6 w-3/4": variant === "title",
          "h-12 w-12 rounded-full": variant === "avatar",
          "h-full w-full": variant === "card",
        },
        className
      )}
      {...props}
    />
  )
}

function CategoryCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

function TestimonialCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex space-x-1 mb-4">
        {Array(5).fill(null).map((_, i) => (
          <Skeleton key={i} className="h-4 w-4" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  )
}

export { Skeleton, CategoryCardSkeleton, TestimonialCardSkeleton }