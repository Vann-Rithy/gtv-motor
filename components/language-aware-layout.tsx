"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"

interface LanguageAwareLayoutProps {
  children: React.ReactNode
}

export function LanguageAwareLayout({ children }: LanguageAwareLayoutProps) {
  const { language } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = language
      // Also set the dir attribute for RTL languages if needed
      document.documentElement.dir = language === 'km' ? 'ltr' : 'ltr'
    }
  }, [language, mounted])

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
