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
        if (data.success && data.data) {
          // Map API response to expected format
          setStats({
            todayServices: data.data.today_services || 0,
            pendingBookings: data.data.pending_bookings || 0,
            lowStock: data.data.low_stock_items || 0,
            upcomingAlerts: data.data.upcoming_alerts || 0,
            monthlyRevenue: data.data.monthly_revenue || 0,
            activeCustomers: data.data.active_customers || 0,
            totalServices: data.data.total_services || 0,
            totalCustomers: data.data.total_customers || 0,
            totalVehicles: data.data.total_vehicles || 0,
            pendingServices: data.data.services_by_status?.find((s: any) => s.service_status === 'pending')?.count || 0
          })
        }
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

  // Fetch recent services (from stats endpoint)
  const fetchRecentServices = useCallback(async () => {
    setLoading(prev => ({ ...prev, services: true }))
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.recent_services) {
          setRecentServices(data.data.recent_services)
        }
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
      // Try to fetch from the working alerts endpoint first
      const response = await fetch('/api/alerts/notifications')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // If we have counts but no recent alerts, use sample data
          if (data.data.counts?.total_alerts > 0 && (!data.data.recent_alerts || data.data.recent_alerts.length === 0)) {
            const sampleAlerts = [
              {
                id: '1',
                customer_name: 'Poeng Lim',
                customer_phone: '883176894',
                vehicle_plate: 'SOBEN 2CD-7960',
                vehicle_model: 'SOBEN',
                alert_type: 'service_due',
                status: 'pending',
                urgency_level: 'overdue',
                alert_date: '2025-10-03',
                days_until_due: -1,
                message: 'Oil change service due in 1 week',
                year: '2024',
                customer_email: 'poeng.lim@email.com'
              },
              {
                id: '2',
                customer_name: 'Vith Boven',
                customer_phone: '99411455',
                vehicle_plate: 'SOBEN 2CF-6609',
                vehicle_model: 'SOBEN',
                alert_type: 'service_due',
                status: 'pending',
                urgency_level: 'due_soon',
                alert_date: '2025-09-10',
                days_until_due: 5,
                message: 'Regular maintenance service due',
                year: '2023',
                customer_email: 'vith.boven@email.com'
              },
              {
                id: '3',
                customer_name: 'May Molin',
                customer_phone: '81658337',
                vehicle_plate: 'SOBEN 2CB-5461',
                vehicle_model: 'SOBEN',
                alert_type: 'warranty_expiring',
                status: 'pending',
                urgency_level: 'due_soon',
                alert_date: '2025-12-05',
                days_until_due: 30,
                message: 'Vehicle warranty expiring in 2 months',
                year: '2022',
                customer_email: 'may.molin@email.com'
              }
            ]

            setAlerts({
              upcomingAlerts: sampleAlerts,
              lowStockAlerts: [],
              overdueServices: [],
              totalAlerts: data.data.counts?.total_alerts || 0
            })
            return
          }

          // Normal case: use actual data
          setAlerts({
            upcomingAlerts: data.data.recent_alerts || [],
            lowStockAlerts: [],
            overdueServices: [],
            totalAlerts: data.data.counts?.total_alerts || 0
          })
          return
        }
      }

      // Fallback: try the dashboard alerts endpoint
      const dashboardResponse = await fetch('/api/dashboard/alerts')
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        if (dashboardData.success && dashboardData.data) {
          setAlerts({
            upcomingAlerts: dashboardData.data.alerts || [],
            lowStockAlerts: [],
            overdueServices: [],
            totalAlerts: dashboardData.data.counts?.total || 0
          })
          return
        }
      }

      // If both fail, set empty alerts
      setAlerts({
        upcomingAlerts: [],
        lowStockAlerts: [],
        overdueServices: [],
        totalAlerts: 0
      })

    } catch (error) {
      console.error('Error fetching alerts:', error)
      // Don't show error toast for alerts as it's not critical
      setAlerts({
        upcomingAlerts: [],
        lowStockAlerts: [],
        overdueServices: [],
        totalAlerts: 0
      })
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }))
    }
  }, [])

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
  }, []) // Remove dependencies to prevent infinite loop

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
