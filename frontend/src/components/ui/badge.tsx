import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        // Enhanced variants for reward tiers
        bronze:
          "border-amber-300 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 dark:from-amber-900/40 dark:to-amber-800/40 dark:text-amber-200 dark:border-amber-700",
        silver:
          "border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700/40 dark:to-gray-800/40 dark:text-gray-200 dark:border-gray-600",
        gold:
          "border-amber-400 bg-gradient-to-r from-amber-200/50 to-amber-400/50 text-amber-800 dark:from-amber-800/40 dark:to-amber-900/40 dark:text-amber-200 dark:border-amber-500 shadow-sm",
        platinum:
          "border-blue-400 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-800/30 dark:to-blue-900/30 dark:text-blue-200 dark:border-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }