import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  loading?: boolean
  growth?: number
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  description,
  loading = false,
  growth,
  className,
}: StatCardProps) {
  const isPositiveGrowth = growth && growth > 0
  const isNegativeGrowth = growth && growth < 0

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "..." : value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {typeof growth !== "undefined" && (
          <p
            className={cn(
              "text-xs font-medium flex items-center gap-1 mt-1",
              isPositiveGrowth && "text-green-600 dark:text-green-400",
              isNegativeGrowth && "text-red-600 dark:text-red-400"
            )}
          >
            {isPositiveGrowth && <ArrowUpIcon className="h-3 w-3" />}
            {isNegativeGrowth && <ArrowDownIcon className="h-3 w-3" />}
            {Math.abs(growth)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  )
} 