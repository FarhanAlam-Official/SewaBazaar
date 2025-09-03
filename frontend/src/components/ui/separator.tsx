"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

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

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => {
    const filteredProps = filterHydrationAttributes(props);

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0 bg-border",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        {...filteredProps}
      />
    )
  }
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }