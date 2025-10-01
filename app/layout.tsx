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
  title: "GTV Motors - After Sales System",
  description: "After Sales Management System for GTV Motors",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
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
