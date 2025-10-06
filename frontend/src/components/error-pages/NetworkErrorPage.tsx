"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WifiOff, Home, RefreshCw, LifeBuoy, Smartphone, Server } from "lucide-react"

export default function NetworkErrorPage() {
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-background px-6 py-16">
      <GradientGrid />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-6 text-center">
        {/* Static Illustration */}
        <div className="relative w-full max-w-5xl">
          <div className="mx-auto flex max-w-4xl items-center justify-between text-red-600 dark:text-red-500">
            <div className="flex items-center justify-center">
              <Smartphone className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32" />
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="h-1 w-40 sm:w-56 md:w-64 rounded-full bg-red-500/40" />
              <WifiOff className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10" />
              <div className="h-1 w-40 sm:w-56 md:w-64 rounded-full bg-red-500/40" />
            </div>
            <div className="flex items-center justify-center">
              <Server className="h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Network error
        </h1>

        <p className="max-w-2xl text-muted-foreground">
          We couldn't reach the server. Please check your internet connection.
        </p>

        <div className="mt-4 grid w-full max-w-md grid-cols-2 gap-3">
          <Button onClick={() => window.location.reload()} size="lg" className="group hover:shadow-lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button asChild variant="outline" size="lg" className="group hover:shadow-lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="group col-span-2 hover:shadow-lg">
            <Link href="/contact">
              <LifeBuoy className="mr-2 h-4 w-4" />
              Contact support
            </Link>
          </Button>
        </div>
      </div>
      <Glow />
    </div>
  )
}

function GradientGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_110%,hsl(var(--primary)/0.12),transparent),linear-gradient(to_bottom,transparent,hsl(var(--foreground)/0.03))]" />
      <div className="absolute inset-0 [background:linear-gradient(to_right,hsl(var(--foreground)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.05)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
    </div>
  )
}

function Glow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center">
      <div className="h-56 w-[40rem] rounded-full bg-primary/20 blur-3xl dark:bg-primary/25" />
    </div>
  )
}
