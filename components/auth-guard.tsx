"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Loader2, Shield } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  // Define public routes that don't require authentication
  const PUBLIC_ROUTES = ["/login", "/register", "/api"]
  const isPublicPath = (pathname: string) => {
    return PUBLIC_ROUTES.some(route => 
      pathname === route || 
      pathname.startsWith(route + "/") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/favicon.ico")
    )
  }

  useEffect(() => {
    // If we're on a public route, don't check authentication
    if (isPublicPath(pathname)) {
      setIsChecking(false)
      return
    }

    // If still loading, wait
    if (loading) {
      return
    }

    // If not authenticated and on a protected route, redirect to login
    if (!isAuthenticated && !isPublicPath(pathname)) {
      console.log("[auth-guard] Not authenticated, redirecting to login")
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`
      router.replace(redirectUrl)
      return
    }

    // If authenticated or on public route, allow access
    setIsChecking(false)
  }, [loading, isAuthenticated, pathname, router])

  // Show loading while checking authentication
  if (isChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Verifying authentication...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  // Allow access if authenticated or on public route
  if (isAuthenticated || isPublicPath(pathname)) {
    return <>{children}</>
  }

  // If not authenticated and not on public route, show redirect message
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-4">
          You must be logged in to access this page. Redirecting to login...
        </p>
        <div className="flex items-center justify-center text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Redirecting...</span>
        </div>
      </div>
    </div>
  )
}
