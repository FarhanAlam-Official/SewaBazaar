import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    template: '%s | SewaBazaar',
    default: 'SewaBazaar - Your One-Stop Service Marketplace',
  },
  description: 'Find and book reliable service providers for all your needs.',
  icons: {
    icon: '/assets/favicon.ico',
    shortcut: '/assets/favicon.ico',
    apple: '/assets/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/assets/android-chrome-512x512.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/assets/android-chrome-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/assets/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/assets/favicon-16x16.png',
      },
    ],
  },
  manifest: '/assets/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SewaBazaar',
  },
  openGraph: {
    type: 'website',
    siteName: 'SewaBazaar',
    title: 'SewaBazaar - Your One-Stop Service Marketplace',
    description: 'Find and book reliable service providers for all your needs.',
    images: [
      {
        url: '/assets/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'SewaBazaar Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SewaBazaar - Your One-Stop Service Marketplace',
    description: 'Find and book reliable service providers for all your needs.',
    images: ['/assets/android-chrome-512x512.png'],
  },
} 