import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import { ClientLayout } from "@/components/layout/client-layout"
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

// Server Component (Root Layout)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
} 