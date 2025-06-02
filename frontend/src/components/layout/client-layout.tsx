"use client"

import { ThemeProvider } from "@/components/theme/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { PageTransition } from "@/components/page-transition"
import { KeyboardFocus } from "@/components/keyboard-focus"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Toaster } from "sonner"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <KeyboardFocus />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <Footer />
        </div>
        <Toaster position="top-right" expand={true} richColors />
      </AuthProvider>
    </ThemeProvider>
  )
} 