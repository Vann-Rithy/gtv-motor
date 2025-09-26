// components/auth-provider.tsx
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { API_ENDPOINTS } from "@/lib/api-config"

interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  staff_id?: number
  is_active: boolean
  last_login?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const PUBLIC_ROUTES = ["/login", "/register", "/api"]
const isPublicPath = (p: string) => PUBLIC_ROUTES.some(r => p === r || p.startsWith(r + "/"))

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const didInit = useRef(false)

  // Get token from localStorage on init and check authentication
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('auth_token')
        if (storedToken) {
          console.log("[auth-provider] Token found in localStorage, checking authentication")
          setToken(storedToken)

          // Immediately check authentication with the stored token
          try {
            setLoading(true)
            const url = `${API_ENDPOINTS.AUTH.ME}?token=${storedToken}`

            const res = await fetch(url, {
              cache: "no-store",
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            })

            if (res.status === 401) {
              console.log("[auth-provider] Stored token is invalid, clearing it")
              localStorage.removeItem('auth_token')
              setToken(null)
              setUser(null)
              setIsAuthenticated(false)
            } else if (res.ok) {
              const ct = res.headers.get("content-type") || ""
              const json = ct.includes("application/json") ? await res.json() : { success: false }

              if (json?.success && json.data) {
                console.log("[auth-provider] User authenticated successfully with stored token")
                setUser(json.data as User)
                setIsAuthenticated(true)
                // Store user data in localStorage for persistence
                localStorage.setItem('auth_user', JSON.stringify(json.data))
              } else {
                console.log("[auth-provider] Authentication failed with stored token")
                localStorage.removeItem('auth_token')
                localStorage.removeItem('auth_user')
                setToken(null)
                setUser(null)
                setIsAuthenticated(false)
              }
            } else {
              // Network error or other issue - keep the token and try again later
              console.log("[auth-provider] Network error, keeping token for retry")
              // Try to restore user data from localStorage
              const storedUser = localStorage.getItem('auth_user')
              if (storedUser) {
                try {
                  const userData = JSON.parse(storedUser)
                  setUser(userData as User)
                  setIsAuthenticated(true)
                  console.log("[auth-provider] Restored user data from localStorage")
                } catch (e) {
                  console.error("[auth-provider] Failed to parse stored user data:", e)
                }
              }
              // Don't clear the token on network errors - let user stay logged in
              // The token will be validated on the next API call
            }
          } catch (e) {
            console.error("[auth-provider] Error checking stored token:", e)
            // Don't clear token on network errors - keep user logged in
            console.log("[auth-provider] Keeping token despite network error")
            // Try to restore user data from localStorage
            const storedUser = localStorage.getItem('auth_user')
            if (storedUser) {
              try {
                const userData = JSON.parse(storedUser)
                setUser(userData as User)
                setIsAuthenticated(true)
                console.log("[auth-provider] Restored user data from localStorage after error")
              } catch (parseError) {
                console.error("[auth-provider] Failed to parse stored user data:", parseError)
              }
            }
          } finally {
            setLoading(false)
          }
        } else {
          console.log("[auth-provider] No token found in localStorage")
          setLoading(false)
        }
      }
    }

    initializeAuth()
  }, [])

  // Watch for pathname changes and handle authentication
  useEffect(() => {
    if (!loading) {
      didInit.current = true

      // If user is authenticated and on login/register page, redirect to dashboard
      if (isAuthenticated && isPublicPath(pathname)) {
        console.log("[auth-provider] Authenticated user on public route, redirecting to dashboard")
        router.replace("/")
      }
    }
  }, [pathname, isAuthenticated, loading, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ email, password })
      })

      const json = await res.json()

      if (res.ok && json.success && json.data && json.data.token) {
        // Store token and user data in localStorage
        localStorage.setItem('auth_token', json.data.token)
        localStorage.setItem('auth_user', JSON.stringify(json.data.user))
        setToken(json.data.token)
        setUser(json.data.user)
        setIsAuthenticated(true)
        return true
      } else {
        console.error("[auth-provider] Login failed:", json.error)
        return false
      }
    } catch (e) {
      console.error("[auth-provider] Login error:", e)
      return false
    }
  }

  const logout = async () => {
    try {
      // Clear token and user data from localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
      router.replace("/login")
    } catch (e) {
      console.error("[auth-provider] logout failed:", e)
      // Even if logout fails, clear local state
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
      router.replace("/login")
    }
  }

  const fetchUser = async () => {
    if (!token) {
      console.log("[auth-provider] No token available for fetchUser")
      return
    }

    try {
      setLoading(true)
      const url = `${API_ENDPOINTS.AUTH.ME}?token=${token}`

      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (res.status === 401) {
        console.log("[auth-provider] Token expired during refresh")
        localStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
        setIsAuthenticated(false)
      } else if (res.ok) {
        const ct = res.headers.get("content-type") || ""
        const json = ct.includes("application/json") ? await res.json() : { success: false }

        if (json?.success && json.data) {
          console.log("[auth-provider] User refreshed successfully")
          setUser(json.data as User)
          setIsAuthenticated(true)
          // Update stored user data
          localStorage.setItem('auth_user', JSON.stringify(json.data))
        } else {
          console.log("[auth-provider] Refresh failed")
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        // Network error or other issue - don't clear user state
        console.log("[auth-provider] Network error during refresh, keeping user state")
      }
    } catch (e) {
      console.error("[auth-provider] Error refreshing user:", e)
      // Don't clear user state on network errors - keep them logged in
      console.log("[auth-provider] Keeping user state despite network error")
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    if (token) {
      await fetchUser()
    } else {
      console.log("[auth-provider] No token available for refresh")
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
