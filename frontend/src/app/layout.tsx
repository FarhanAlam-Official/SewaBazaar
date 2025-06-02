import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { PageTransition } from "@/components/page-transition"
import { KeyboardFocus } from "@/components/keyboard-focus"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import "@/styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
})

export const metadata = {
  title: 'SewaBazaar - Local Services Marketplace',
  description: 'Find trusted professionals for all your home and personal needs. Book services in minutes.',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport = {
  themeColor: '#40C4FF',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
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
            <Toaster />
            <SonnerToaster position="top-right" expand={true} richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 