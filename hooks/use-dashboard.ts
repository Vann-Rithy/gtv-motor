import { useState, useEffect, useCallback } from 'react'
import { useToast } from './use-toast'

interface DashboardStats {
  todayServices: number
  pendingBookings: number
  lowStock: number
  upcomingAlerts: number
  monthlyRevenue: number
  activeCustomers: number
  totalServices: number
  totalCustomers: number
  totalVehicles: number
  pendingServices: number
}

interface RecentService {
  id: number
  invoice_number: string
  customer_name: string
  vehicle_plate: string
  vehicle_model: string
  service_type_name: string
  total_amount: number
  service_status: string
  service_date: string
  payment_status: string
  created_at: string
}

interface DashboardAlert {
  id: number
  alert_type: string
  alert_date: string
  message: string
  status: string
  customer_name: string
  customer_phone: string
  vehicle_plate: string
  vehicle_model: string
  days_until_due: number
}

interface LowStockAlert {
  id: number
  item_name: string
  current_stock: number
  min_stock: number
  category_name: string
  stock_percentage: number
}

interface OverdueService {
  id: number
  invoice_number: string
  customer_name: string
  vehicle_plate: string
  vehicle_model: string
  service_date: string
  days_overdue: number
}

interface RevenueData {
  monthlyRevenue: Array<{
    month: string
    month_name: string
    revenue: number
    service_count: number
  }>
  todayRevenue: { revenue: number; serviceCount: number }
  weekRevenue: { revenue: number; serviceCount: number }
  yearRevenue: { revenue: number; serviceCount: number }
  revenueByServiceType: Array<{
    service_type: string
    category: string
    total_revenue: number
    service_count: number
    avg_revenue: number
  }>
  paymentMethods: Array<{
    payment_method: string
    count: number
    total_amount: number
  }>
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentServices, setRecentServices] = useState<RecentService[]>([])
  const [alerts, setAlerts] = useState<{
    upcomingAlerts: DashboardAlert[]
    lowStockAlerts: LowStockAlert[]
    overdueServices: OverdueService[]
    totalAlerts: number
  } | null>(null)
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState({
    stats: false,
    services: false,
    alerts: false,
    revenue: false
  })
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }))
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        throw new Error('Failed to fetch dashboard stats')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }, [toast])

  // Fetch recent services
  const fetchRecentServices = useCallback(async () => {
    setLoading(prev => ({ ...prev, services: true }))
    try {
      const response = await fetch('/api/dashboard/recent-services')
      if (response.ok) {
        const data = await response.json()
        setRecentServices(data)
      } else {
        throw new Error('Failed to fetch recent services')
      }
    } catch (error) {
      console.error('Error fetching recent services:', error)
      toast({
        title: "Error",
        description: "Failed to fetch recent services",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, services: false }))
    }
  }, [toast])

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    setLoading(prev => ({ ...prev, alerts: true }))
    try {
      const response = await fetch('/api/dashboard/alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data)
      } else {
        throw new Error('Failed to fetch alerts')
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast({
        title: "Error",
        description: "Failed to fetch alerts",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }))
    }
  }, [toast])

  // Fetch revenue data
  const fetchRevenue = useCallback(async () => {
    setLoading(prev => ({ ...prev, revenue: true }))
    try {
      const response = await fetch('/api/dashboard/revenue')
      if (response.ok) {
        const data = await response.json()
        setRevenue(data)
      } else {
        throw new Error('Failed to fetch revenue data')
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch revenue data",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, revenue: false }))
    }
  }, [toast])

  // Refresh all dashboard data
  const refreshDashboard = useCallback(async () => {
    try {
      setError(null)
      await Promise.all([
        fetchStats(),
        fetchRecentServices(),
        fetchAlerts(),
        fetchRevenue()
      ])
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
      setError('Failed to refresh dashboard data')
    }
  }, [fetchStats, fetchRecentServices, fetchAlerts, fetchRevenue])

  // Auto-refresh dashboard data every 5 minutes
  useEffect(() => {
    refreshDashboard()
    
    const interval = setInterval(refreshDashboard, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [refreshDashboard])

  // Check if any data is loading
  const isLoading = Object.values(loading).some(Boolean)

  return {
    // State
    stats,
    recentServices,
    alerts,
    revenue,
    loading,
    isLoading,
    error,
    
    // Actions
    fetchStats,
    fetchRecentServices,
    fetchAlerts,
    fetchRevenue,
    refreshDashboard
  }
}
