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

  // Initialize authentication - Check for stored session
  useEffect(() => {
    const initializeAuth = () => {
      if (typeof window !== 'undefined') {
        try {
          setLoading(true)

          // Check for stored session data
          const sessionData = localStorage.getItem('gtv_session')

          if (sessionData) {
            const session = JSON.parse(sessionData)

            // Validate session data
            if (session.token && session.user && session.expiresAt) {
              const now = new Date().getTime()
              const expiresAt = new Date(session.expiresAt).getTime()

              if (now < expiresAt) {
                // Session is valid
                setToken(session.token)
                setUser(session.user)
                setIsAuthenticated(true)
                console.log('[auth-provider] Session restored successfully')
              } else {
                // Session expired
                console.log('[auth-provider] Session expired, clearing...')
                clearSession()
              }
            } else {
              // Invalid session data
              console.log('[auth-provider] Invalid session data, clearing...')
              clearSession()
            }
          } else {
            // No session found
            console.log('[auth-provider] No session found')
            setToken(null)
            setUser(null)
            setIsAuthenticated(false)
          }
        } catch (error) {
          console.error('[auth-provider] Error initializing auth:', error)
          clearSession()
        } finally {
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

  // Helper function to clear session
  const clearSession = () => {
    localStorage.removeItem('gtv_session')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  // Helper function to save session
  const saveSession = (user: User, token: string) => {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    const session = {
      token,
      user,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    }

    localStorage.setItem('gtv_session', JSON.stringify(session))
    setToken(token)
    setUser(user)
    setIsAuthenticated(true)
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("[auth-provider] Starting login process...")

      // Make actual API call to backend
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      })

      if (!response.ok) {
        console.error("[auth-provider] Login failed with status:", response.status)
        return false
      }

      const data = await response.json()

      if (data.success && data.data) {
        const userData = data.data.user || data.data
        const token = data.data.token || data.data.access_token

        if (userData && token) {
          // Save session with real user data
          saveSession(userData, token)

          console.log("[auth-provider] Login successful")
          return true
        }
      }

      console.error("[auth-provider] Invalid login response format")
      return false
    } catch (e) {
      console.error("[auth-provider] Login error:", e)
      clearSession()
      return false
    }
  }

  const logout = async () => {
    try {
      console.log("[auth-provider] Starting logout process...")

      // Clear session data
      clearSession()

      console.log("[auth-provider] Logout successful, redirecting to login...")
      router.replace("/login")
    } catch (e) {
      console.error("[auth-provider] Logout error:", e)
      // Even if logout fails, clear local state
      clearSession()
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
        clearSession()
      } else if (res.ok) {
        const ct = res.headers.get("content-type") || ""
        const json = ct.includes("application/json") ? await res.json() : { success: false }

        if (json?.success && json.data) {
          console.log("[auth-provider] User refreshed successfully")
          // Update session with new user data
          saveSession(json.data as User, token)
        } else {
          console.log("[auth-provider] Refresh failed")
          clearSession()
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
