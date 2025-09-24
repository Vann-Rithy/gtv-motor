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
  const router = useRouter()
  const pathname = usePathname()
  const didInit = useRef(false)

  const fetchUser = async () => {
    try {
      setLoading(true)
      const res = await fetch(API_ENDPOINTS.AUTH.ME, { 
        cache: "no-store", 
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      // Handle 401 (Unauthorized) gracefully - this is expected when not logged in
      if (res.status === 401) {
        console.log("[auth-provider] 401 Unauthorized - no valid session")
        setUser(null)
        setIsAuthenticated(false)
        return
      }
      
      const ct = res.headers.get("content-type") || ""
      const json = ct.includes("application/json") ? await res.json() : { success: false }

      if (res.ok && json?.success && json.user) {
        console.log("[auth-provider] User authenticated successfully")
        setUser(json.user as User)
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

    // Check authentication status on app start
    void fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const logout = async () => {
    try {
      await fetch(API_ENDPOINTS.AUTH.LOGOUT, { method: "POST" })
      setUser(null)
      setIsAuthenticated(false)
      router.replace("/login")
    } catch (e) {
      console.error("[auth-provider] logout failed:", e)
      // Even if logout fails, clear local state
      setUser(null)
      setIsAuthenticated(false)
      router.replace("/login")
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
