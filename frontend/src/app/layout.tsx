import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "@/styles/globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { ErrorProvider } from "@/contexts/ErrorContext"
import { ClientLayout } from "@/components/layout/client-layout"
import { ToastProvider } from "@/components/ui/toast-provider"
import { metadata } from './metadata'

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

export { metadata }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorProvider>
            <AuthProvider>
              <NotificationProvider>
                <div suppressHydrationWarning>
                  <ClientLayout>
                    {children}
                  </ClientLayout>
                  <ToastProvider />
                </div>
              </NotificationProvider>
            </AuthProvider>
          </ErrorProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}