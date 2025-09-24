"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string[]
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = [], 
  fallback 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [loading, isAuthenticated, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized if not authenticated
  if (!isAuthenticated || !user) {
    return fallback || (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to access this page.
          </p>
          <Button 
            onClick={() => router.push("/login")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // Check role permissions if required
  if (requiredRole.length > 0) {
    const hasPermission = requiredRole.includes(user.role)
    
    if (!hasPermission) {
      return (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <Shield className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Insufficient Permissions</h2>
            <p className="text-gray-600 mb-4">
              You don't have the required role to access this page. 
              Required role: {requiredRole.join(" or ")}
            </p>
            <Button 
              onClick={() => router.push("/")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}
