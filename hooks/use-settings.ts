import { useState, useEffect, useCallback } from 'react'
import { useToast } from './use-toast'
import { API_ENDPOINTS } from '@/lib/api-config'

interface CompanySettings {
  company_name: string
  address: string
  phone: string
  email: string
  tax_id: string
  logo_url: string
  website: string
  business_hours: any
}

interface SystemConfig {
  currency: string
  date_format: string
  time_format: string
  language: string
  timezone: string
  auto_backup: boolean
  maintenance_mode: boolean
  session_timeout: number
  max_login_attempts: number
  password_expiry_days: number
}

interface NotificationSettings {
  email_notifications: boolean
  sms_notifications: boolean
  service_reminders: boolean
  low_stock_alerts: boolean
  warranty_expiry: boolean
  daily_reports: boolean
  booking_confirmation: boolean
  payment_reminders: boolean
}

interface Staff {
  id: number
  name: string
  role: string
  phone: string
  email: string
  active: boolean
  created_at: string
}

export function useSettings() {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState({
    company: false,
    system: false,
    notifications: false,
    staff: false
  })
  const [saving, setSaving] = useState({
    company: false,
    system: false,
    notifications: false,
    staff: false
  })
  
  const { toast } = useToast()

  // Fetch company settings
  const fetchCompanySettings = useCallback(async () => {
    setLoading(prev => ({ ...prev, company: true }))
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS + '/company')
      if (response.ok) {
        const data = await response.json()
        setCompanySettings(data)
      } else {
        throw new Error('Failed to fetch company settings')
      }
    } catch (error) {
      console.error('Error fetching company settings:', error)
      toast({
        title: "Error",
        description: "Failed to fetch company settings",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, company: false }))
    }
  }, [toast])

  // Fetch system configuration
  const fetchSystemConfig = useCallback(async () => {
    setLoading(prev => ({ ...prev, system: true }))
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS + '/system')
      if (response.ok) {
        const data = await response.json()
        setSystemConfig(data)
      } else {
        throw new Error('Failed to fetch system configuration')
      }
    } catch (error) {
      console.error('Error fetching system config:', error)
      toast({
        title: "Error",
        description: "Failed to fetch system configuration",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, system: false }))
    }
  }, [toast])

  // Fetch notification settings
  const fetchNotificationSettings = useCallback(async () => {
    setLoading(prev => ({ ...prev, notifications: true }))
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS + '/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotificationSettings(data)
      } else {
        throw new Error('Failed to fetch notification settings')
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
      toast({
        title: "Error",
        description: "Failed to fetch notification settings",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }))
    }
  }, [toast])

  // Fetch staff members
  const fetchStaff = useCallback(async () => {
    setLoading(prev => ({ ...prev, staff: true }))
    try {
      const response = await fetch(API_ENDPOINTS.STAFF)
      if (response.ok) {
        const data = await response.json()
        setStaff(data.data || [])
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: "Error",
        description: "Failed to fetch staff members",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, staff: false }))
    }
  }, [toast])

  // Save company settings
  const saveCompanySettings = useCallback(async (settings: Partial<CompanySettings>) => {
    setSaving(prev => ({ ...prev, company: true }))
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS + '/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        const data = await response.json()
        setCompanySettings(prev => ({ ...prev, ...settings } as CompanySettings))
        toast({
          title: "Success",
          description: data.message || "Company settings saved successfully"
        })
        return true
      } else {
        throw new Error('Failed to save company settings')
      }
    } catch (error) {
      console.error('Error saving company settings:', error)
      toast({
        title: "Error",
        description: "Failed to save company settings",
        variant: "destructive"
      })
      return false
    } finally {
      setSaving(prev => ({ ...prev, company: false }))
    }
  }, [toast])

  // Save system configuration
  const saveSystemConfig = useCallback(async (config: Partial<SystemConfig>) => {
    setSaving(prev => ({ ...prev, system: true }))
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS + '/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        const data = await response.json()
        setSystemConfig(prev => ({ ...prev, ...config } as SystemConfig))
        toast({
          title: "Success",
          description: data.message || "System configuration saved successfully"
        })
        return true
      } else {
        throw new Error('Failed to save system configuration')
      }
    } catch (error) {
      console.error('Error saving system config:', error)
      toast({
        title: "Error",
        description: "Failed to save system configuration",
        variant: "destructive"
      })
      return false
    } finally {
      setSaving(prev => ({ ...prev, system: false }))
    }
  }, [toast])

  // Save notification settings
  const saveNotificationSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    setSaving(prev => ({ ...prev, notifications: true }))
    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS + '/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotificationSettings(prev => ({ ...prev, ...settings } as NotificationSettings))
        toast({
          title: "Success",
          description: data.message || "Notification settings saved successfully"
        })
        return true
      } else {
        throw new Error('Failed to save notification settings')
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive"
      })
      return false
    } finally {
      setSaving(prev => ({ ...prev, notifications: false }))
    }
  }, [toast])

  // Add new staff member
  const addStaffMember = useCallback(async (staffData: { name: string; role: string; phone?: string; email?: string }) => {
    setSaving(prev => ({ ...prev, staff: true }))
    try {
      const response = await fetch(API_ENDPOINTS.STAFF, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      })
      
      if (response.ok) {
        const data = await response.json()
        // Refresh staff list
        await fetchStaff()
        toast({
          title: "Success",
          description: data.message || "Staff member added successfully"
        })
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add staff member')
      }
    } catch (error) {
      console.error('Error adding staff member:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add staff member",
        variant: "destructive"
      })
      return false
    } finally {
      setSaving(prev => ({ ...prev, staff: false }))
    }
  }, [toast, fetchStaff])

  // Remove staff member
  const removeStaffMember = useCallback(async (staffId: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.STAFF}/${staffId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Refresh staff list
        await fetchStaff()
        toast({
          title: "Success",
          description: data.message || "Staff member removed successfully"
        })
        return true
      } else {
        throw new Error('Failed to remove staff member')
      }
    } catch (error) {
      console.error('Error removing staff member:', error)
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive"
      })
      return false
    }
  }, [toast, fetchStaff])

  // Toggle staff status
  const toggleStaffStatus = useCallback(async (staffId: number, active: boolean) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.STAFF}/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Update local state
        setStaff(prev => prev.map(staff => 
          staff.id === staffId ? { ...staff, active } : staff
        ))
        toast({
          title: "Success",
          description: data.message || `Staff member ${active ? 'activated' : 'deactivated'} successfully`
        })
        return true
      } else {
        throw new Error('Failed to update staff status')
      }
    } catch (error) {
      console.error('Error updating staff status:', error)
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive"
      })
      return false
    }
  }, [toast])

  // Load all settings on mount
  useEffect(() => {
    fetchCompanySettings()
    fetchSystemConfig()
    fetchNotificationSettings()
    fetchStaff()
  }, [fetchCompanySettings, fetchSystemConfig, fetchNotificationSettings, fetchStaff])

  return {
    // State
    companySettings,
    systemConfig,
    notificationSettings,
    staff,
    loading,
    saving,
    
    // Actions
    fetchCompanySettings,
    fetchSystemConfig,
    fetchNotificationSettings,
    fetchStaff,
    saveCompanySettings,
    saveSystemConfig,
    saveNotificationSettings,
    addStaffMember,
    removeStaffMember,
    toggleStaffStatus
  }
}
