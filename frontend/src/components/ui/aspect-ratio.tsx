"use client"

import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

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

const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>
>(({ ...props }, ref) => {
  const filteredProps = filterHydrationAttributes(props);

  return (
    <AspectRatioPrimitive.Root
      ref={ref}
      {...filteredProps}
    />
  )
})

export { AspectRatio }