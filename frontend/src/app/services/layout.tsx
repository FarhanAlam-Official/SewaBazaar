"use client"

import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
        {children}
      </Suspense>
    </div>
  )
} 