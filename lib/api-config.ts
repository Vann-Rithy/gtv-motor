/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// API Base URL - Production server (api.gtvmotor.dev)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gtvmotor.dev'

// API v1 Base URL - For API v1 endpoints
export const API_V1_BASE_URL = process.env.NEXT_PUBLIC_API_V1_URL || 'https://api.gtvmotor.dev/api/v1'

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ME: `${API_BASE_URL}/api/auth/me`,
  },

  // Core Resources
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  VEHICLES: `${API_BASE_URL}/api/vehicles`,
  SERVICES: `${API_BASE_URL}/api/services`,
  BOOKINGS: `${API_BASE_URL}/api/bookings`,

  // Inventory
  INVENTORY: `${API_BASE_URL}/api/inventory`,

  // Staff
  STAFF: `${API_BASE_URL}/api/staff`,

  // Service Types
  SERVICE_TYPES: `${API_BASE_URL}/api/service-types`,

  // Service Items
  SERVICE_ITEMS: `${API_BASE_URL}/api/service-items`,

  // Warranties
  WARRANTIES: `${API_BASE_URL}/api/warranties.php`,
  WARRANTY_PARTS: `${API_BASE_URL}/api/vehicle_warranty_parts.php`,

  // Alerts & Notifications
  ALERTS: `${API_BASE_URL}/api/alerts`,
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
  ALERTS_NOTIFICATIONS: `${API_BASE_URL}/api/alerts/notifications`,

  // Dashboard
  DASHBOARD: {
    STATS: `${API_BASE_URL}/api/dashboard/stats`,
    ANALYTICS: `${API_BASE_URL}/api/dashboard/analytics`,
    REVENUE: `${API_BASE_URL}/api/dashboard/revenue`,
    ALERTS: `${API_BASE_URL}/api/dashboard/alerts`,
  },

  // Reports
  REPORTS: {
    SUMMARY: `${API_BASE_URL}/api/reports/summary`,
    CUSTOMER: `${API_BASE_URL}/api/reports/customer`,
    WARRANTY: `${API_BASE_URL}/api/reports/warranty`,
    INVENTORY: `${API_BASE_URL}/api/reports/inventory`,
  },

  // Settings
  SETTINGS: `${API_BASE_URL}/api/settings`,

  // Health
  HEALTH: `${API_BASE_URL}/api/health`,
} as const

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

// Environment configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
} as const

// Sample data for when APIs are down
export const SAMPLE_DATA = {
  CUSTOMERS: [
    {
      id: 1,
      name: "John Doe",
      phone: "012345678",
      email: "john@example.com",
      address: "Phnom Penh",
      total_spent: 500,
      vehicle_count: 1,
      service_count: 3,
      alert_count: 0,
      booking_count: 1,
      pending_services: 0,
      in_progress_services: 0,
      completed_services: 3,
      pending_alerts: 0,
      vehicles: [
        {
          id: 1,
          plate_number: "ABC-1234",
          model: "SOBEN",
          year: 2023,
          vin_number: "VIN123456789"
        }
      ]
    },
    {
      id: 2,
      name: "Jane Smith",
      phone: "098765432",
      email: "jane@example.com",
      address: "Siem Reap",
      total_spent: 750,
      vehicle_count: 2,
      service_count: 5,
      alert_count: 1,
      booking_count: 2,
      pending_services: 1,
      in_progress_services: 0,
      completed_services: 4,
      pending_alerts: 1,
      vehicles: [
        {
          id: 2,
          plate_number: "XYZ-5678",
          model: "KAIN",
          year: 2022,
          vin_number: "VIN987654321"
        }
      ]
    }
  ],
  SERVICES: [
    {
      id: 1,
      invoice_number: "INV-001",
      service_date: "2025-01-15",
      total_amount: 150,
      service_status: "completed",
      payment_status: "paid",
      payment_method: "cash",
      service_type_name: "Oil Change",
      service_detail: "Regular oil change service",
      plate_number: "ABC-1234",
      vehicle_plate: "ABC-1234",
      vehicle_model: "SOBEN",
      vehicle_year: 2023,
      customer_name: "John Doe",
      customer_phone: "012345678",
      technician_name: "Tech 1",
      notes: "Service completed successfully"
    },
    {
      id: 2,
      invoice_number: "INV-002",
      service_date: "2025-01-14",
      total_amount: 300,
      service_status: "in_progress",
      payment_status: "pending",
      payment_method: "aba",
      service_type_name: "Maintenance",
      service_detail: "Full vehicle maintenance",
      plate_number: "XYZ-5678",
      vehicle_plate: "XYZ-5678",
      vehicle_model: "KAIN",
      vehicle_year: 2022,
      customer_name: "Jane Smith",
      customer_phone: "098765432",
      technician_name: "Tech 2",
      notes: "In progress"
    }
  ],
  INVENTORY: [
    {
      id: 1,
      name: "Engine Oil 0W-20",
      sku: "EO-0W20-001",
      category_name: "Engine Oil",
      current_stock: 5,
      min_stock: 10,
      max_stock: 50,
      unit_price: 25.00,
      supplier: "Oil Supplier Co.",
      last_restocked: "2025-01-10",
      stock_status: "low"
    },
    {
      id: 2,
      name: "Air Filter",
      sku: "AF-001",
      category_name: "Filters",
      current_stock: 15,
      min_stock: 5,
      max_stock: 30,
      unit_price: 12.50,
      supplier: "Filter Supplier",
      last_restocked: "2025-01-12",
      stock_status: "normal"
    }
  ],
  WARRANTIES: [
    {
      id: 1,
      customer_name: "John Doe",
      vehicle_plate: "ABC-1234",
      vehicle_model: "SOBEN",
      warranty_type: "standard",
      start_date: "2023-01-01",
      end_date: "2026-01-01",
      status: "active",
      km_limit: 100000,
      max_services: 10,
      remaining_services: 7,
      remaining_km: 75000
    },
    {
      id: 2,
      customer_name: "Jane Smith",
      vehicle_plate: "XYZ-5678",
      vehicle_model: "KAIN",
      warranty_type: "extended",
      start_date: "2022-06-01",
      end_date: "2025-06-01",
      status: "expiring_soon",
      km_limit: 150000,
      max_services: 15,
      remaining_services: 3,
      remaining_km: 25000
    }
  ]
} as const
