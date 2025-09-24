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

  // Get token from localStorage on init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        setToken(storedToken)
      }
    }
  }, [])

  const fetchUser = async () => {
    try {
      setLoading(true)

      // Only make request if we have a token
      if (!token) {
        console.log("[auth-provider] No token available, skipping user fetch")
        setUser(null)
        setIsAuthenticated(false)
        return
      }

      // Use URL parameter method instead of Authorization header
      const url = `${API_ENDPOINTS.AUTH.ME}?token=${token}`

      const res = await fetch(url, {
        cache: "no-store",
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      // Handle 401 (Unauthorized) gracefully - token might be expired
      if (res.status === 401) {
        console.log("[auth-provider] 401 Unauthorized - token expired or invalid")
        localStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
        setIsAuthenticated(false)
        return
      }

      const ct = res.headers.get("content-type") || ""
      const json = ct.includes("application/json") ? await res.json() : { success: false }

      if (res.ok && json?.success && json.data) {
        console.log("[auth-provider] User authenticated successfully")
        setUser(json.data as User)
        setIsAuthenticated(true)
      } else {
        console.log("[auth-provider] Authentication failed:", json.error || "Unknown error")
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (e) {
      console.error("[auth-provider] /api/auth/me failed:", e)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    // Only check authentication if we have a token
    if (token) {
      console.log("[auth-provider] Token found, checking authentication status")
      void fetchUser()
    } else {
      console.log("[auth-provider] No token found, skipping authentication check")
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Watch for pathname changes and handle authentication
  useEffect(() => {
    if (didInit.current && !loading) {
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
        // Store token in localStorage
        localStorage.setItem('auth_token', json.data.token)
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
      // Clear token from localStorage
      localStorage.removeItem('auth_token')
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
      router.replace("/login")
    } catch (e) {
      console.error("[auth-provider] logout failed:", e)
      // Even if logout fails, clear local state
      localStorage.removeItem('auth_token')
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
      router.replace("/login")
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
