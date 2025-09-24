import { WarrantyWithDetails } from "./types"

// Calculate warranty status based on dates and usage
export function calculateWarrantyStatus(warranty: WarrantyWithDetails): {
  status: "active" | "expired" | "expiring_soon" | "suspended" | "cancelled"
  daysUntilExpiry: number
  kmRemaining: number
  servicesRemaining: number
} {
  const now = new Date()
  const endDate = new Date(warranty.end_date)
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  const currentKm = warranty.current_km || 0
  const kmRemaining = Math.max(0, warranty.km_limit - currentKm)
  const servicesRemaining = Math.max(0, warranty.max_services - warranty.services_used)
  
  // Determine status
  let status: "active" | "expired" | "expiring_soon" | "suspended" | "cancelled" = "active"
  
  if (warranty.status === "cancelled") {
    status = "cancelled"
  } else if (warranty.status === "suspended") {
    status = "suspended"
  } else if (daysUntilExpiry < 0) {
    status = "expired"
  } else if (daysUntilExpiry <= 30) {
    status = "expiring_soon"
  } else if (kmRemaining <= 0 || servicesRemaining <= 0) {
    status = "expired"
  }
  
  return {
    status,
    daysUntilExpiry,
    kmRemaining,
    servicesRemaining
  }
}

// Check if warranty is eligible for service
export function isWarrantyEligibleForService(warranty: WarrantyWithDetails): {
  eligible: boolean
  reason?: string
} {
  const status = calculateWarrantyStatus(warranty)
  
  if (status.status === "expired") {
    return { eligible: false, reason: "Warranty has expired" }
  }
  
  if (status.status === "cancelled") {
    return { eligible: false, reason: "Warranty has been cancelled" }
  }
  
  if (status.status === "suspended") {
    return { eligible: false, reason: "Warranty is suspended" }
  }
  
  if (status.servicesRemaining <= 0) {
    return { eligible: false, reason: "Maximum services used" }
  }
  
  if (status.kmRemaining <= 0) {
    return { eligible: false, reason: "Kilometer limit exceeded" }
  }
  
  return { eligible: true }
}

// Calculate warranty coverage percentage
export function calculateWarrantyCoverage(warranty: WarrantyWithDetails): {
  kmCoverage: number
  serviceCoverage: number
  timeCoverage: number
} {
  const now = new Date()
  const startDate = new Date(warranty.start_date)
  const endDate = new Date(warranty.end_date)
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const currentKm = warranty.current_km || 0
  const kmCoverage = Math.min(100, (currentKm / warranty.km_limit) * 100)
  const serviceCoverage = (warranty.services_used / warranty.max_services) * 100
  const timeCoverage = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
  
  return {
    kmCoverage,
    serviceCoverage,
    timeCoverage
  }
}

// Format warranty duration
export function formatWarrantyDuration(startDate: Date, endDate: Date): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const years = Math.floor(diffDays / 365)
  const months = Math.floor((diffDays % 365) / 30)
  
  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`
  }
  return `${months} month${months > 1 ? 's' : ''}`
}

// Get warranty type display name
export function getWarrantyTypeDisplayName(type: string): string {
  switch (type) {
    case "standard":
      return "Standard Warranty"
    case "extended":
      return "Extended Warranty"
    case "premium":
      return "Premium Warranty"
    default:
      return type
  }
}

// Get warranty status color
export function getWarrantyStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "expired":
      return "bg-red-100 text-red-800"
    case "expiring_soon":
      return "bg-yellow-100 text-yellow-800"
    case "suspended":
      return "bg-orange-100 text-orange-800"
    case "cancelled":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Validate warranty data
export function validateWarrantyData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.vehicle_id) {
    errors.push("Vehicle is required")
  }
  
  if (!data.start_date) {
    errors.push("Start date is required")
  }
  
  if (!data.end_date) {
    errors.push("End date is required")
  }
  
  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    if (start >= end) {
      errors.push("End date must be after start date")
    }
  }
  
  if (data.km_limit && data.km_limit <= 0) {
    errors.push("Kilometer limit must be greater than 0")
  }
  
  if (data.max_services && data.max_services <= 0) {
    errors.push("Maximum services must be greater than 0")
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
