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

  // Initialize authentication - Developer Mode (restore only if stored)
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        try {
          setLoading(true)
          const storedToken = localStorage.getItem('auth_token')
          const storedUser = localStorage.getItem('auth_user')

          if (storedToken && storedUser) {
            const parsedUser: User = JSON.parse(storedUser)
            setToken(storedToken)
            setUser(parsedUser)
            setIsAuthenticated(true)
            console.log('[auth-provider] Restored session from localStorage')
          } else {
            setToken(null)
            setUser(null)
            setIsAuthenticated(false)
            console.log('[auth-provider] No stored session; user is logged out')
          }
        } catch (e) {
          console.error('[auth-provider] Failed to restore session:', e)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          setToken(null)
          setUser(null)
          setIsAuthenticated(false)
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Developer Mode - Always return success
      console.log("[auth-provider] Developer Mode - Login always succeeds")

      const defaultUser: User = {
        id: 1,
        username: 'admin',
        email: 'admin@gtvmotor.com',
        full_name: 'Administrator',
        role: 'admin',
        staff_id: 1,
        is_active: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      // Store token and user data in localStorage
      localStorage.setItem('auth_token', 'dev-token-123')
      localStorage.setItem('auth_user', JSON.stringify(defaultUser))
      setToken('dev-token-123')
      setUser(defaultUser)
      setIsAuthenticated(true)
      return true
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
