"use client"

import { PageTransition } from "@/components/page-transition"
import { KeyboardFocus } from "@/components/keyboard-focus"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { memo } from "react"

const MainContent = memo(({ children }: { children: React.ReactNode }) => (
  <main className="flex-1">
    <PageTransition>{children}</PageTransition>
  </main>
))
MainContent.displayName = "MainContent"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KeyboardFocus />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <MainContent>{children}</MainContent>
        <Footer />
      </div>
    </>
  )
} 