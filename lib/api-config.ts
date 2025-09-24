/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// API Base URL - change this for different environments
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/backend'

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
  
  // Warranties
  WARRANTIES: `${API_BASE_URL}/api/warranties`,
  
  // Alerts & Notifications
  ALERTS: `${API_BASE_URL}/api/alerts`,
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
  
  // Dashboard
  DASHBOARD: {
    STATS: `${API_BASE_URL}/api/dashboard/stats`,
    ANALYTICS: `${API_BASE_URL}/api/dashboard/analytics`,
  },
  
  // Reports
  REPORTS: {
    SUMMARY: `${API_BASE_URL}/api/reports/summary`,
    CUSTOMER: `${API_BASE_URL}/api/reports/customer`,
    WARRANTY: `${API_BASE_URL}/api/reports/warranty`,
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
