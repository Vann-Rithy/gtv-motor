// lib/api-client-with-settings.ts
// Enhanced API client with timeout, retry, and caching support

interface ApiSettings {
  baseUrl: string
  apiKey: string
  timeout: number
  retryAttempts: number
  cacheDuration: number
  enableCaching: boolean
}

interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
}

class ApiClientWithSettings {
  private cache: Map<string, CacheEntry> = new Map()
  private settings: ApiSettings | null = null

  /**
   * Load API settings from database
   */
  async loadSettings(): Promise<ApiSettings> {
    if (this.settings) {
      return this.settings
    }

    try {
      const response = await fetch('/api/settings?type=api')
      const data = await response.json()

      if (data.success && data.data) {
        this.settings = {
          baseUrl: data.data.baseUrl || 'https://api.gtvmotor.dev/api/v1',
          apiKey: data.data.apiKey || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
          timeout: parseInt(data.data.timeout) || 30000,
          retryAttempts: parseInt(data.data.retryAttempts) || 3,
          cacheDuration: parseInt(data.data.cacheDuration) || 300,
          enableCaching: data.data.enableCaching !== false
        }
      } else {
        // Use defaults
        this.settings = {
          baseUrl: 'https://api.gtvmotor.dev/api/v1',
          apiKey: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
          timeout: 30000,
          retryAttempts: 3,
          cacheDuration: 300,
          enableCaching: true
        }
      }
    } catch (error) {
      console.error('Failed to load API settings:', error)
      // Use defaults
      this.settings = {
        baseUrl: 'https://api.gtvmotor.dev/api/v1',
        apiKey: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
        timeout: 30000,
        retryAttempts: 3,
        cacheDuration: 300,
        enableCaching: true
      }
    }

    return this.settings
  }

  /**
   * Get cache key for a request
   */
  private getCacheKey(url: string, method: string, body?: any): string {
    const bodyStr = body ? JSON.stringify(body) : ''
    return `${method}:${url}:${bodyStr}`
  }

  /**
   * Check if cached entry is still valid
   */
  private getCached(cacheKey: string): any | null {
    if (!this.settings?.enableCaching) {
      return null
    }

    const entry = this.cache.get(cacheKey)
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey)
      return null
    }

    return entry.data
  }

  /**
   * Store data in cache
   */
  private setCached(cacheKey: string, data: any): void {
    if (!this.settings?.enableCaching) {
      return
    }

    const now = Date.now()
    const expiresAt = now + (this.settings.cacheDuration * 1000)

    this.cache.set(cacheKey, {
      data,
      timestamp: now,
      expiresAt
    })

    // Clean up expired entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache()
    }
  }

  /**
   * Remove expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Make API request with timeout
   */
  private async makeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const settings = await this.loadSettings()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), settings.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'X-API-Key': settings.apiKey,
          'Content-Type': 'application/json',
          ...(options.headers as HeadersInit)
        }
      })

      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${settings.timeout}ms`)
      }
      throw error
    }
  }

  /**
   * Make API request with retry logic
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit & { 
      useCache?: boolean
      skipCache?: boolean
    } = {}
  ): Promise<T> {
    const settings = await this.loadSettings()
    const method = (options.method || 'GET').toUpperCase()
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${settings.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

    // Check cache for GET requests
    if (method === 'GET' && options.useCache !== false && !options.skipCache) {
      const cacheKey = this.getCacheKey(url, method)
      const cached = this.getCached(cacheKey)
      if (cached) {
        console.log(`[Cache Hit] ${method} ${url}`)
        return cached as T
      }
    }

    // Prepare body
    let body = options.body
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      body = JSON.stringify(body)
    }

    // Retry logic
    let lastError: Error | null = null
    const maxRetries = settings.retryAttempts

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: wait 2^attempt * 100ms
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          console.log(`[Retry ${attempt}/${maxRetries}] Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const response = await this.makeRequest(url, {
          ...options,
          method,
          body
        })

        if (!response.ok) {
          // Don't retry on client errors (4xx) except 408, 429
          if (response.status >= 400 && response.status < 500 && 
              response.status !== 408 && response.status !== 429) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
          }

          // Retry on server errors (5xx) or specific client errors
          if (attempt < maxRetries) {
            console.log(`[Retry ${attempt + 1}/${maxRetries}] HTTP ${response.status} - will retry`)
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
            continue
          }

          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
        }

        const data = await response.json()

        // Cache successful GET responses
        if (method === 'GET' && options.useCache !== false && !options.skipCache) {
          const cacheKey = this.getCacheKey(url, method)
          this.setCached(cacheKey, data)
        }

        return data as T

      } catch (error: any) {
        lastError = error

        // Don't retry on timeout or abort errors after max retries
        if (attempt < maxRetries && 
            (error.message?.includes('timeout') || 
             error.name === 'AbortError' ||
             error.message?.includes('network'))) {
          console.log(`[Retry ${attempt + 1}/${maxRetries}] ${error.message} - will retry`)
          continue
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error
        }
      }
    }

    // Should never reach here, but just in case
    throw lastError || new Error('Request failed after all retries')
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clear cache for specific endpoint
   */
  clearCacheFor(endpoint: string, method: string = 'GET'): void {
    const settings = this.settings || {
      baseUrl: 'https://api.gtvmotor.dev/api/v1',
      apiKey: '',
      timeout: 30000,
      retryAttempts: 3,
      cacheDuration: 300,
      enableCaching: true
    }
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${settings.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    const cacheKey = this.getCacheKey(url, method)
    this.cache.delete(cacheKey)
  }

  /**
   * Get current settings
   */
  getSettings(): ApiSettings | null {
    return this.settings
  }

  /**
   * Refresh settings from database
   */
  async refreshSettings(): Promise<void> {
    this.settings = null
    await this.loadSettings()
  }
}

// Export singleton instance
export const apiClientWithSettings = new ApiClientWithSettings()
export default apiClientWithSettings

