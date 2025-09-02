"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

// Helper function to filter out problematic attributes that cause hydration errors
const filterHydrationAttributes = (props: Record<string, any>) => {
  if (!props) return {}
  
  return Object.fromEntries(
    Object.entries(props).filter(
      ([key]) => ![
        "fdprocessedid", 
        "data-rk", 
        "data-kt",
        "data-form-type",
        "data-bv-focus",
        "data-bv-readonly"
      ].includes(key) && !key.startsWith("data-1pass-")
    )
  );
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const filteredProps = filterHydrationAttributes(props);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...filteredProps}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }