"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, AlertTriangle, DollarSign, Wrench, TrendingUp, Package, RefreshCw, Clock, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useDashboard } from "@/hooks/use-dashboard"
import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/lib/language-context"

export default function Dashboard() {
  const { user } = useAuth()
  const { t, language } = useLanguage()


  const {
    stats,
    recentServices,
    alerts,
    revenue,
    loading: dashboardLoading,
    isLoading,
    error,
    refreshDashboard
  } = useDashboard()


  if (isLoading && !stats) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('dashboard.error_loading', 'Error Loading Dashboard')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={refreshDashboard}>{t('dashboard.try_again', 'Try Again')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome', 'Welcome back')}, {user?.full_name || user?.username || 'User'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('dashboard.subtitle', "Here's what's happening with your business today.")}
          </p>
        </div>
        <Button onClick={refreshDashboard} disabled={isLoading} className="shrink-0">
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              {t('dashboard.refreshing', 'Refreshing...')}
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('dashboard.refresh', 'Refresh')}
            </>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.total_revenue', 'Total Revenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.monthlyRevenue?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              +0% {t('dashboard.from_last_month', 'from last month')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.total_customers', 'Total Customers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers || '0'}</div>
            <p className="text-xs text-muted-foreground">
              +0 {t('dashboard.new_this_month', 'new this month')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.active_services', 'Active Services')}</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalServices || '0'}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.todayServices || 0} {t('dashboard.completed_today', 'completed today')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.pending_bookings', 'Pending Bookings')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingBookings || '0'}</div>
            <p className="text-xs text-muted-foreground">
              0 {t('dashboard.scheduled_today', 'scheduled today')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('dashboard.recent_services', 'Recent Services')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.latest_activities', 'Latest service activities in your system')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentServices && recentServices.length > 0 ? (
              <div className="space-y-4">
                {recentServices.slice(0, 5).map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{service.customer_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{service.service_type_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${service.total_amount}</p>
                      <Badge variant={service.status === 'completed' ? 'default' : 'secondary'}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Wrench className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>{t('dashboard.no_services', 'No recent services')}</p>
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" asChild className="w-full">
                <Link href="/services">{t('dashboard.view_all_services', 'View All Services')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t('dashboard.recent_alerts', 'Recent Alerts')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.important_notifications', 'Important notifications and alerts')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts && alerts.upcomingAlerts && alerts.upcomingAlerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.upcomingAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        {alert.customer_name} - {alert.vehicle_plate}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">
                        {new Date(alert.alert_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-300 dark:text-green-600" />
                <p>{t('dashboard.no_alerts', 'No active alerts')}</p>
                {alerts && alerts.totalAlerts > 0 && (
                  <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                    ({alerts.totalAlerts} alerts in system - check Alerts page for details)
                  </p>
                )}
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" asChild className="w-full">
                <Link href="/alerts">{t('dashboard.view_all_alerts', 'View All Alerts')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quick_actions', 'Quick Actions')}</CardTitle>
          <CardDescription>
            {t('dashboard.common_tasks', 'Common tasks and shortcuts')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-auto p-4 flex-col gap-2">
              <Link href="/services/new">
                <Wrench className="h-6 w-6" />
                <span>{t('dashboard.new_service', 'New Service')}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
              <Link href="/bookings/new">
                <Calendar className="h-6 w-6" />
                <span>{t('dashboard.new_booking', 'New Booking')}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
              <Link href="/customers/new">
                <Users className="h-6 w-6" />
                <span>{t('dashboard.new_customer', 'New Customer')}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
              <Link href="/inventory/add">
                <Package className="h-6 w-6" />
                <span>{t('dashboard.add_inventory', 'Add Inventory')}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
