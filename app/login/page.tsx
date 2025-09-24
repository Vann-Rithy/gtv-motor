"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { API_ENDPOINTS } from "@/lib/api-config"

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, login } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get("redirect") || "/"
      router.replace(redirectTo)
    }
  }, [isAuthenticated, router, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const success = await login(credentials.email, credentials.password)

      if (success) {
        setSuccess(true)
        setError("")

        // Get redirect URL from query params or default to dashboard
        const redirectTo = searchParams.get("redirect") || "/"

        // Show success message briefly before redirecting
        setTimeout(() => {
          router.replace(redirectTo)
        }, 1000)
      } else {
        setError("Login failed. Please check your credentials.")
        setSuccess(false)
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
      setSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  // If already authenticated, show loading
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Already logged in, redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/90">
        <CardHeader className="text-center border-0 bg-transparent pb-2">
          <div className="flex justify-center mb-2">
            <div className="relative w-24 h-24">
              <Image
                src="/Logo GTV.png"
                alt="GTV Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>
          <p className="text-gray-600 font-medium">After Sales Management System</p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Login Successful!</h3>
              <p className="text-gray-600">Redirecting to dashboard...</p>
              <div className="flex items-center justify-center text-blue-600 mt-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Please wait...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className="bg-white/80"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    placeholder="Enter password"
                    required
                    className="bg-white/80"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}

          {!success && (
            <div className="mt-4 text-center">
              <Link href="/register" className="text-sm text-blue-600 hover:text-blue-700">
                Don't have an account? Create one
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
