// Database entity types based on the MySQL schema

export interface Customer {
  id: number
  name: string
  phone: string
  address?: string
  email?: string
  created_at: Date
  updated_at: Date
  // Additional fields from database
  customer_name?: string
  customer_email?: string
  customer_address?: string
}

export interface Vehicle {
  id: number
  customer_id: number
  plate_number: string
  model: string
  vin_number?: string
  year?: number
  purchase_date?: Date
  warranty_start_date?: Date
  warranty_end_date?: Date
  warranty_km_limit: number
  warranty_service_count: number
  warranty_max_services: number
  created_at: Date
  updated_at: Date
  // Additional fields from database
  vehicle_plate?: string
  current_km?: number
}

export interface ServiceType {
  id: number
  service_type_name: string
  description?: string
  created_at: Date
}

export interface Service {
  id: number
  invoice_number: string
  customer_id: number
  vehicle_id: number
  service_type_id: number
  service_date: Date
  current_km?: number
  next_service_km?: number
  next_service_date?: Date
  total_amount: number
  payment_method: "cash" | "aba" | "card" | "bank_transfer"
  payment_status: "pending" | "paid" | "cancelled"
  service_status: "pending" | "in_progress" | "completed" | "cancelled"
  notes?: string
  technician_id?: number
  sales_rep_id?: number
  created_at: Date
  updated_at: Date
  // Additional fields from database
  service_cost?: number
}

export interface ServiceItem {
  id: number
  service_id: number
  description: string
  quantity: number
  unit_price: number
  total_price: number
  item_type: "service" | "part" | "labor"
  created_at: Date
}

export interface InventoryCategory {
  id: number
  name: string
  description?: string
  created_at: Date
}

export interface InventoryItem {
  id: number
  category_id: number
  name: string
  sku?: string
  current_stock: number
  min_stock: number
  max_stock: number
  unit_price: number
  supplier?: string
  last_restocked?: Date
  created_at: Date
  updated_at: Date
}

export interface StockMovement {
  id: number
  item_id: number
  movement_type: "in" | "out" | "adjustment"
  quantity: number
  reference_type: "purchase" | "service" | "adjustment" | "return"
  reference_id?: number
  notes?: string
  created_at: Date
}

export interface Staff {
  id: number
  name: string
  role: "admin" | "service_advisor" | "technician" | "manager"
  phone?: string
  email?: string
  active: boolean
  created_at: Date
  updated_at: Date
  // Additional fields from database
  staff_name?: string
  password_hash?: string
  last_login?: Date
  permissions?: any
  department?: string
  hire_date?: Date
  salary?: number
  emergency_contact?: any
}

export interface ServiceAlert {
  id: number
  customer_id: number
  vehicle_id: number
  alert_type: "service_due" | "warranty_expiring" | "follow_up"
  alert_date: Date
  message?: string
  status: "pending" | "sent" | "completed"
  created_at: Date
  updated_at: Date
  // Additional fields from API response
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  customer_address?: string
  vehicle_plate?: string
  vehicle_model?: string
  vin_number?: string
  year?: number
  urgency_level?: "overdue" | "due_today" | "due_soon" | "upcoming"
  days_until_due?: number
}

export interface ServiceAlertWithDetails extends ServiceAlert {
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_address?: string
  vehicle_plate: string
  vehicle_model: string
  vin_number?: string
  year?: number
  urgency_level: "overdue" | "due_today" | "due_soon" | "upcoming"
  days_until_due: number
}

export interface NotificationCounts {
  total_alerts: number
  pending_alerts: number
  sent_alerts: number
  completed_alerts: number
  overdue_alerts: number
  due_today_alerts: number
  due_soon_alerts: number
  service_due_alerts: number
  warranty_alerts: number
  follow_up_alerts: number
  notificationCount: number
}

export interface Booking {
  id: number
  phone: string
  customer_data: string // JSON string
  vehicle_data: string // JSON string
  service_type_id: number
  booking_date: Date
  booking_time: string
  status: "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"
  notes?: string
  created_at: Date
  updated_at: Date
}

// Extended types with joined data
export interface ServiceWithDetails extends Service {
  customer_name: string
  vehicle_plate: string
  service_type_name: string
  technician_name?: string
  sales_rep_name?: string
}

export interface VehicleWithCustomer extends Vehicle {
  customer_name: string
  customer_phone: string
}

export interface BookingWithDetails extends Booking {
  customer_name: string
  vehicle_plate: string
  service_type_name: string
  customer_phone: string
  vehicle_model: string
  vehicle_vin: string
  vehicle_year: number
}

// Warranty types
export interface Warranty {
  id: number
  vehicle_id: number
  warranty_type: "standard" | "extended" | "premium"
  start_date: Date
  end_date: Date
  km_limit: number
  max_services: number
  terms_conditions?: string
  status: "active" | "expired" | "suspended" | "cancelled"
  created_at: Date
  updated_at: Date
  // Additional fields from database
  warranty_start_date?: Date
  warranty_end_date?: Date
  warranty_cost_covered?: number
}

export interface WarrantyService {
  id: number
  warranty_id: number
  service_id: number
  service_date: Date
  km_at_service: number
  service_type: string
  cost_covered: number
  notes?: string
  created_at: Date
}

export interface WarrantyClaim {
  id: number
  warranty_id: number
  customer_id: number
  vehicle_id: number
  claim_type: "repair" | "replacement" | "maintenance"
  description: string
  claim_date: Date
  status: "pending" | "approved" | "rejected" | "completed"
  estimated_cost?: number
  actual_cost?: number
  approved_by?: number
  approved_date?: Date
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface WarrantyWithDetails extends Warranty {
  customer_name: string
  customer_phone: string
  customer_address?: string
  customer_email?: string
  vehicle_plate: string
  vehicle_model: string
  vin_number?: string
  year?: number
  purchase_date?: Date
  current_km?: number
  services_used: number
  last_service_date?: Date
  total_services_amount?: number
  warranty_cost_covered?: number
}

export interface WarrantyClaimWithDetails extends WarrantyClaim {
  customer_name: string
  vehicle_plate: string
  warranty_type: string
  approved_by_name?: string
}

// Additional types for better type safety
export interface InventoryMovement {
  id: number
  inventory_id: number
  movement_type: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  unit_price: number
  movement_date: Date
  staff_id: number
  notes?: string
}

export interface CompanySettings {
  id: number
  company_name: string
  address?: string
  phone?: string
  email?: string
  tax_id?: string
  logo_url?: string
  website?: string
  business_hours?: string
  created_at: Date
  updated_at: Date
}

export interface SystemConfig {
  id: number
  config_key: string
  config_value?: string
  config_type: "string" | "number" | "boolean" | "json"
  description?: string
  created_at: Date
  updated_at: Date
}

export interface NotificationSetting {
  id: number
  setting_key: string
  setting_value: boolean
  description?: string
  created_at: Date
  updated_at: Date
}

export interface User {
  id: number
  username: string
  email: string
  password_hash: string
  full_name: string
  role: "admin" | "manager" | "service_advisor" | "technician" | "viewer"
  staff_id?: number
  is_active: boolean
  last_login?: Date
  password_reset_token?: string
  password_reset_expires?: Date
  created_at: Date
  updated_at: Date
}

export interface LoginAttempt {
  id: number
  email: string
  ip_address: string
  success: boolean
  attempted_at: Date
  user_agent?: string
}

export interface UserSession {
  id: string
  user_id: number
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export interface UserPermission {
  id: number
  user_id: number
  permission: string
  granted_at: Date
  granted_by: number
}
