// lib/api-client.ts

type Primitive = string | number | boolean | null | undefined

function buildQuery(params?: Record<string, Primitive>) {
  if (!params) return ""
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return
    sp.set(k, String(v))
  })
  const qs = sp.toString()
  return qs ? `?${qs}` : ""
}

async function parseResponse(res: Response) {
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    return res.json()
  }
  // fall back to text (useful for HTML error pages or plain messages)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

class ApiClient {
  private baseUrl: string
  private defaultTimeoutMs = 20000

  constructor(baseUrl = "https://api.gtvmotor.dev") {
    this.baseUrl = baseUrl
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit & { timeoutMs?: number } = {},
  ): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`

    // Add token to URL parameter for authenticated endpoints (except auth endpoints)
    if (typeof window !== 'undefined' && !endpoint.startsWith('/api/auth/')) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        const separator = url.includes('?') ? '&' : '?'
        url = `${url}${separator}token=${token}`
      }
    }

    // Abort/timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? this.defaultTimeoutMs)

    // Handle body properly
    let body = options.body as any
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData

    // If body is a plain object, JSON-encode it
    if (body && !isFormData && typeof body !== "string") {
      try {
        body = JSON.stringify(body)
      } catch (error) {
        console.error("Failed to stringify body:", error)
        throw new Error("Invalid request body")
      }
    }

    // Only set JSON header if not sending FormData
    const baseHeaders: HeadersInit =
      isFormData
        ? (options.headers as HeadersInit) || {}
        : { "Content-Type": "application/json", ...(options.headers as HeadersInit) }

    const method = (options.method || "GET").toUpperCase()

    const config: RequestInit = {
      method,
      body: method === "GET" || method === "HEAD" ? undefined : body,
      headers: baseHeaders,
      cache: method === "GET" ? "no-store" : options.cache, // avoid stale reads
      signal: controller.signal,
      ...options,
    }

    try {
      const res = await fetch(url, config)
      const data = await parseResponse(res)

      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          `HTTP ${res.status} ${res.statusText}`
        const err = new Error(msg) as Error & { status?: number; payload?: any }
        err.status = res.status
        err.payload = data
        throw err
      }

      // Some endpoints may return 204 No Content
      return (data ?? ({} as T)) as T
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error)
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  // ---------- Auth (optional helpers) ----------
  async me() {
    // Use URL parameter method for consistency
    return this.request("/api/auth/me", { method: "GET" })
  }
  async login(body: { email: string; password: string }) {
    return this.request("/api/auth/login", { method: "POST", body: JSON.stringify(body) })
  }
  async logout() {
    return this.request("/api/auth/logout", { method: "POST" })
  }
  async register(body: { username: string; email: string; password: string; full_name: string; role?: string }) {
    return this.request("/api/auth/register", { method: "POST", body: JSON.stringify(body) })
  }

  // ---------- Dashboard ----------
  async getDashboardStats() {
    return this.request("/api/dashboard/stats", { method: "GET" })
  }
  async getDashboardAnalytics(params?: { range?: string; from?: string; to?: string }) {
    return this.request(`/api/dashboard/analytics${buildQuery(params)}`, { method: "GET" })
  }

  // ---------- Customers ----------
  async getCustomers(params?: { page?: number; limit?: number; search?: string }) {
    return this.request(`/api/customers${buildQuery(params)}`, { method: "GET" })
  }
  async getCustomer(id: number | string) {
    return this.request(`/api/customers/${id}`, { method: "GET" })
  }
  async createCustomer(data: any) {
    return this.request("/api/customers", { method: "POST", body: JSON.stringify(data) })
  }
  async updateCustomer(id: number | string, data: any) {
    return this.request(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }
  async deleteCustomer(id: number | string) {
    return this.request(`/api/customers/${id}`, { method: "DELETE" })
  }

  // ---------- Vehicles ----------
  async getVehicles(params?: { page?: number; limit?: number; search?: string; customer_id?: number | string }) {
    return this.request(`/api/vehicles${buildQuery(params)}`, { method: "GET" })
  }
  async getVehicle(id: number | string) {
    return this.request(`/api/vehicles/${id}`, { method: "GET" })
  }
  async createVehicle(data: any) {
    return this.request("/api/vehicles", { method: "POST", body: JSON.stringify(data) })
  }
  async updateVehicle(id: number | string, data: any) {
    return this.request(`/api/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }
  async deleteVehicle(id: number | string) {
    return this.request(`/api/vehicles/${id}`, { method: "DELETE" })
  }

  // ---------- Services ----------
  async getServices(params?: { page?: number; limit?: number; search?: string; status?: string; customer_id?: number; vehicle_id?: number }) {
    return this.request(`/api/services${buildQuery(params)}`, { method: "GET" })
  }
  async getService(id: number | string) {
    return this.request(`/api/services/${id}`, { method: "GET" })
  }
  async createService(data: {
    customer_id: number
    vehicle_id: number
    service_type_id: number
    service_date: string
    current_km?: number | null
    next_service_km?: number | null
    next_service_date?: string | null
    total_amount: number
    service_cost?: number
    payment_method: string
    service_status?: string
    payment_status?: string
    technician_id?: number | null
    sales_rep_id?: number | null
    notes?: string | null
    service_items?: Array<{
      description: string
      quantity: number
      unit_price: number
      item_type: 'service' | 'part' | 'labor'
    }>
  }) {
    return this.request("/api/services", { method: "POST", body: JSON.stringify(data) })
  }
  async updateService(id: number | string, data: any) {
    return this.request(`/api/services/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }

  // ---------- Service Types ----------
  async getServiceTypes() {
    return this.request("/api/service-types", { method: "GET" })
  }
  async createServiceType(data: { service_type_name: string; description?: string }) {
    return this.request("/api/service-types", { method: "POST", body: JSON.stringify(data) })
  }

  // ---------- Bookings ----------
  async getBookings(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    date?: string
  }) {
    return this.request(`/api/bookings${buildQuery(params)}`, { method: "GET" })
  }
  async getBooking(id: number | string) {
    return this.request(`/api/bookings/${id}`, { method: "GET" })
  }
  async createBooking(data: {
    phone: string
    customer_data: any
    vehicle_data: any
    service_type_id: number
    booking_date: string
    booking_time: string
    status?: string
    notes?: string
  }) {
    return this.request("/api/bookings", { method: "POST", body: JSON.stringify(data) })
  }
  async updateBooking(id: number | string, data: any) {
    return this.request(`/api/bookings/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }
  async deleteBooking(id: number | string) {
    return this.request(`/api/bookings/${id}`, { method: "DELETE" })
  }

  // ---------- Inventory ----------
  async getInventory(params?: {
    page?: number;
    limit?: number;
    search?: string;
    low_stock?: boolean;
    out_of_stock?: boolean;
    category_id?: string | number
  }) {
    return this.request(`/api/inventory${buildQuery(params)}`, { method: "GET" })
  }
  async createInventoryItem(data: {
    name: string
    sku?: string
    category_id: number
    current_stock: number
    min_stock: number
    max_stock: number
    unit_price: number
    supplier?: string
  }) {
    return this.request("/api/inventory", { method: "POST", body: JSON.stringify(data) })
  }
  async updateInventoryItem(id: number, data: {
    name: string
    sku?: string | null
    category_id: number
    current_stock: number
    min_stock: number
    max_stock: number
    unit_price: number
    supplier?: string | null
  }) {
    return this.request(`/api/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }

  // ---------- Staff ----------
  async getStaff(params?: { page?: number; limit?: number; role?: string; active?: boolean }) {
    return this.request(`/api/staff${buildQuery(params)}`, { method: "GET" })
  }
  async createStaff(data: {
    name: string
    role: string
    phone?: string
    email?: string
    department?: string
    hire_date?: string
    salary?: number
    emergency_contact?: any
    active?: boolean
  }) {
    return this.request("/api/staff", { method: "POST", body: JSON.stringify(data) })
  }

  // ---------- Warranties ----------
  async getWarranties(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vehicle_id?: number;
    expiring_soon?: boolean;
  }) {
    return this.request(`/api/warranties${buildQuery(params)}`, { method: "GET" })
  }
  async createWarranty(data: {
    vehicle_id: number
    warranty_type: string
    start_date: string
    end_date: string
    km_limit?: number
    max_services?: number
    terms_conditions?: string
    status?: string
  }) {
    return this.request("/api/warranties", { method: "POST", body: JSON.stringify(data) })
  }

  // ---------- Alerts ----------
  async getAlerts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    alert_type?: string;
    customer_id?: number;
    vehicle_id?: number;
    urgency?: string;
  }) {
    return this.request(`/api/alerts${buildQuery(params)}`, { method: "GET" })
  }
  async createAlert(data: {
    customer_id: number
    vehicle_id: number
    alert_type: string
    alert_date: string
    message?: string
    status?: string
  }) {
    return this.request("/api/alerts", { method: "POST", body: JSON.stringify(data) })
  }

  // ---------- Notifications ----------
  async getNotifications() {
    return this.request("/api/notifications", { method: "GET" })
  }

  // ---------- Reports ----------
  async getSummaryReport(params?: { from?: string; to?: string }) {
    return this.request(`/api/reports/summary${buildQuery(params)}`, { method: "GET" })
  }
  async getCustomerReport(params?: { from?: string; to?: string; customer_id?: number }) {
    return this.request(`/api/reports/customer${buildQuery(params)}`, { method: "GET" })
  }
  async getWarrantyReport(params?: { from?: string; to?: string; status?: string; expiring_soon?: boolean }) {
    return this.request(`/api/reports/warranty${buildQuery(params)}`, { method: "GET" })
  }

  // ---------- Settings ----------
  async getSettings() {
    return this.request("/api/settings", { method: "GET" })
  }
  async updateSettings(type: 'company' | 'system' | 'notifications', data: any) {
    return this.request(`/api/settings?type=${type}`, { method: "POST", body: JSON.stringify(data) })
  }

  // ---------- Health ----------
  async healthCheck() {
    return this.request("/api/health", { method: "GET" })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
