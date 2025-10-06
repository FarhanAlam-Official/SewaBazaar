"use client"

import Link from "next/link"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, Bug, ServerCrash } from "lucide-react"

export default function ServerErrorPage() {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 140, damping: 16, mass: 0.7 })
  const y = useSpring(my, { stiffness: 140, damping: 16, mass: 0.7 })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height
    const range = 14
    mx.set((relX - 0.5) * range)
    my.set((relY - 0.5) * range)
  }

  function handleLeave() {
    mx.set(0)
    my.set(0)
  }
  
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-background px-6 py-16">
      <GradientGrid />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-6 text-center"
      >
        <motion.div className="relative" onMouseMove={handleMove} onMouseLeave={handleLeave}>
          <motion.div
            style={{ x, y }}
            initial={{ scale: 0.95, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative flex h-52 w-[32rem] items-center justify-center gap-6 rounded-3xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-sm shadow-[0_10px_40px_rgba(239,68,68,0.15)]"
          >
            <div className="flex items-center text-red-600 dark:text-red-500">
              <ServerCrash className="h-16 w-16" />
            </div>
            <motion.div
              initial={{ letterSpacing: "-0.02em" }}
              animate={{ letterSpacing: ["-0.02em", "0.02em", "-0.02em"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl font-extrabold tracking-tight text-red-600 dark:text-red-500"
            >
              500
            </motion.div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-red-600/80 dark:text-red-400/80">Internal Server Error</div>
              <div className="text-xs text-red-600/60 dark:text-red-400/60">Please try again later</div>
            </div>
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400 md:text-4xl"
        >
          Sorry , It's not you. It's us.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-muted-foreground"
        >
          We're working to fix the issue. You can go back, return home, or report
          the problem.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-4 grid w-full max-w-md grid-cols-2 gap-3"
        >
          <Button onClick={() => window.history.back()} variant="outline" size="lg" className="hover:shadow-lg">
            Go back
          </Button>
          <Button asChild size="lg" className="hover:shadow-lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="col-span-2 hover:shadow-lg">
            <Link href="/contact">
              <Bug className="mr-2 h-4 w-4" />
              Report a problem
            </Link>
          </Button>
        </motion.div>
      </motion.div>
      <FloatingOrbs />
      <Glow />
    </div>
  )
}

function GradientGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_110%,hsl(0_85%_60%/0.15),transparent),linear-gradient(to_bottom,transparent,hsl(var(--foreground)/0.05))]" />
      <div className="absolute inset-0 [background:linear-gradient(to_right,hsl(var(--foreground)/0.06)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
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

function FloatingOrbs() {
  const orbs = [
    { size: 220, x: -280, y: -80, c: "0 85% 60%" },
    { size: 140, x: 280, y: 40, c: "var(--foreground)" },
    { size: 90, x: -40, y: 160, c: "var(--muted-foreground)" },
  ] as const

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-2xl"
          style={{
            width: o.size,
            height: o.size,
            left: `calc(50% + ${o.x}px)`,
            top: `calc(50% + ${o.y}px)`,
            background: `radial-gradient(circle, hsl(${o.c}/0.5), transparent 60%)`,
          }}
          initial={{ y: 0 }}
          animate={{ y: [ -8, 8, -8 ] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}
