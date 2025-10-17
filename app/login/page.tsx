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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="text-center relative z-10 animate-fade-in-up">
          <div className="relative mb-6">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
            <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Already logged in</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/10 dark:bg-indigo-800/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>
      
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm card-entrance">
        <CardHeader className="text-center border-0 bg-transparent pb-6">
          <div className="flex justify-center mb-4 animate-count-up">
            <div className="relative w-28 h-28 p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full shadow-lg animate-float">
              <Image
                src="/Logo GTV.png"
                alt="GTV Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority
                className="p-2"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 animate-slide-in-left">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-300 font-medium animate-slide-in-right">After Sales Management System</p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          {success ? (
            <div className="text-center py-8 animate-fade-in-up">
              <div className="relative mb-6">
                <CheckCircle className="h-20 w-20 text-green-500 dark:text-green-400 mx-auto animate-count-up" />
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3 animate-slide-in-left">Login Successful!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 animate-slide-in-right">Redirecting to dashboard...</p>
              <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 animate-fade-in-up">
                <Loader2 className="h-5 w-5 animate-spin mr-3" />
                <span className="font-medium">Please wait...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 animate-slide-in-left">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className="h-12 bg-white/90 dark:bg-gray-700/90 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 input-focus"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2 animate-slide-in-right">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                    className="h-12 bg-white/90 dark:bg-gray-700/90 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 pr-12 input-focus"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in-up">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none btn-hover-lift"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}

          {!success && (
            <div className="mt-8 text-center animate-fade-in-up">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">New to GTV Motor?</span>
                </div>
              </div>
              <Link 
                href="/register" 
                className="mt-4 inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105"
              >
                Create New Account
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
