"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "./theme-toggle"
import Sidebar from "./sidebar"
import Header from "./header"
import { useAuth } from "@/components/auth-provider"
import { LanguageAwareLayout } from "@/components/language-aware-layout"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isAuthPage = pathname === "/login" || pathname === "/register"

  // Don't show sidebar/header on auth pages
  if (isAuthPage) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageAwareLayout>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            user={user}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header
              onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              user={user}
            />

            {/* Page Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-800">
              {children}
            </main>
          </div>
        </div>
      </LanguageAwareLayout>
    </ThemeProvider>
  )
}
