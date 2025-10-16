// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import MainLayout from "@/components/layout/main-layout"
import { AuthProvider } from "@/components/auth-provider"
import AuthGuard from "@/components/auth-guard"
import { LanguageProvider } from "@/lib/language-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GTV Motor - Professional Vehicle Service Management",
  description: "Professional vehicle service management system for GTV Motor. Manage customers, vehicles, services, bookings, inventory, and warranties.",
  keywords: ["GTV Motor", "vehicle service", "automotive", "service management", "Cambodia"],
  authors: [{ name: "GTV Motor" }],
  creator: "GTV Motor",
  publisher: "GTV Motor",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#2563eb",
  colorScheme: "light dark",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "GTV Motor - Professional Vehicle Service Management",
    description: "Professional vehicle service management system for GTV Motor",
    type: "website",
    locale: "en_US",
    siteName: "GTV Motor",
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'GTV Motor Logo'
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "GTV Motor - Professional Vehicle Service Management",
    description: "Professional vehicle service management system for GTV Motor",
    images: ['/android-chrome-512x512.png']
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            <AuthGuard>
              <MainLayout>{children}</MainLayout>
            </AuthGuard>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
