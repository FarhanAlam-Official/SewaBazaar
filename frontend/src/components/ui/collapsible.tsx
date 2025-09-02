"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

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

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>
>(({ ...props }, ref) => {
  const filteredProps = filterHydrationAttributes(props);

  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      ref={ref}
      {...filteredProps}
    />
  )
})

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ ...props }, ref) => {
  const filteredProps = filterHydrationAttributes(props);

  return (
    <CollapsiblePrimitive.CollapsibleContent
      ref={ref}
      {...filteredProps}
    />
  )
})

export { Collapsible, CollapsibleTrigger, CollapsibleContent }