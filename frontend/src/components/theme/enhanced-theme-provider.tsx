"use client"

import * as React from "react"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

interface EnhancedThemeProviderProps extends ThemeProviderProps {
  children: React.ReactNode
}

export function EnhancedThemeProvider({ children, ...props }: EnhancedThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="sewabazaar-theme"
      {...props}
    >
      {children}
    </NextThemeProvider>
  )
}

// Hook for theme management with enhanced features
export const useEnhancedTheme = () => {
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  return {
    mounted,
    // Add more theme utilities here as needed
  }
}