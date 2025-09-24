/**
 * Professional Authentication System - Frontend
 * GTV Motor Frontend - Production Ready
 */

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

interface AuthResponse {
  success: boolean
  user?: User
  access_token?: string
  token_type?: string
  expires_in?: number
  session_id?: string
  error?: string
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp?: string
}

class ProfessionalAuthClient {
  private baseUrl: string
  private token: string | null = null
  private refreshPromise: Promise<string> | null = null

  constructor(baseUrl: string = 'https://api.gtvmotor.dev') {
    this.baseUrl = baseUrl
    this.loadTokenFromStorage()
  }

  /**
   * Load token from localStorage
   */
  private loadTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('gtv_access_token')
    }
  }

  /**
   * Save token to localStorage
   */
  private saveTokenToStorage(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gtv_access_token', token)
      this.token = token
    }
  }

  /**
   * Clear token from storage
   */
  private clearTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gtv_access_token')
      this.token = null
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...options.headers
    }

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      })

      const data = await response.json()

      // Handle token expiration
      if (response.status === 401 && this.token) {
        this.clearTokenFromStorage()
        throw new Error('Session expired')
      }

      return data
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  /**
   * Professional login with comprehensive error handling
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<{
        user: User
        access_token: string
        token_type: string
        expires_in: number
        session_id: string
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      if (response.success && response.data?.access_token) {
        // Save token
        this.saveTokenToStorage(response.data.access_token)

        return {
          success: true,
          user: response.data.user,
          access_token: response.data.access_token,
          token_type: response.data.token_type,
          expires_in: response.data.expires_in,
          session_id: response.data.session_id
        }
      } else {
        return {
          success: false,
          error: response.error || 'Login failed'
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<User>('/api/auth/me')

      if (response.success && response.data) {
        return {
          success: true,
          user: response.data
        }
      } else {
        this.clearTokenFromStorage()
        return {
          success: false,
          error: response.error || 'Authentication failed'
        }
      }
    } catch (error) {
      console.error('Get user error:', error)
      this.clearTokenFromStorage()
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.makeRequest('/api/auth/logout', {
          method: 'POST'
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearTokenFromStorage()
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Make authenticated API call
   */
  async apiCall<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await this.makeRequest<T>(endpoint, options)

    if (!response.success) {
      throw new Error(response.error || 'API call failed')
    }

    return response.data as T
  }
}

// Export singleton instance
export const authClient = new ProfessionalAuthClient()

// React Hook for authentication
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const result = await authClient.getCurrentUser()

      if (result.success && result.user) {
        setUser(result.user)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await authClient.login(email, password)

      if (result.success && result.user) {
        setUser(result.user)
        setIsAuthenticated(true)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await authClient.logout()
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshUser: checkAuthStatus
  }
}

export default authClient
