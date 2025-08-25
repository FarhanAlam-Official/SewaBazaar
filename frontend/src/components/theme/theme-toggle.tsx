"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative overflow-hidden rounded-full"
        suppressHydrationWarning
      >
        <span className="sr-only">Loading theme toggle</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative overflow-hidden hover:bg-gradient-to-r from-[#1E40AF]/40 to-[#3B82F6]/50 rounded-full transition-all duration-500 ease-bounce hover:scale-110 hover:shadow-lg hover:shadow-primary/25 border border-transparent hover:border-primary/20"
      suppressHydrationWarning
    >
      <Sun 
        className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-500 ease-spring dark:-rotate-90 dark:scale-0 text-yellow-500 hover:text-yellow-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        strokeWidth={2.5}
      />
      <Moon 
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-500 ease-spring dark:rotate-0 dark:scale-100 text-blue-500 hover:text-blue-600 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        strokeWidth={2.5}
      />
      <div className="absolute inset-0 dark:bg-gradient-to-r dark:from-blue-600/10 dark:via-purple-600/10 dark:to-blue-600/10 light:bg-gradient-to-r light:from-yellow-200/10 light:via-orange-200/10 light:to-yellow-200/10 rounded-full transition-opacity duration-500 ease-spring opacity-0 group-hover:opacity-100" />
      <div className="absolute inset-0 rounded-full ring-2 ring-primary/10 transition-all duration-500 ease-spring opacity-0 hover:opacity-100 hover:ring-primary/20" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}