"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, AlertTriangle, Calendar, Phone, Car, Check, X, Search, RefreshCw, MessageSquare } from "lucide-react"
import { ServiceAlertWithDetails, NotificationCounts } from "@/lib/types"
import { toast } from "sonner"
import FollowUpModal from "@/components/follow-up-modal"

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<ServiceAlertWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [refreshing, setRefreshing] = useState(false)
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts | null>(null)

  // Fetch alerts from API
  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (typeFilter !== "all") {
        params.append("type", typeFilter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/alerts?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch alerts")
      }

      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error("Error fetching alerts:", error)
      toast.error("Failed to load alerts")
    } finally {
      setLoading(false)
    }
  }

  // Fetch notification counts
  const fetchNotificationCounts = async () => {
    try {
      const response = await fetch("/api/alerts/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotificationCounts(data)
      }
    } catch (error) {
      console.error("Error fetching notification counts:", error)
    }
  }

  // Refresh alerts
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchAlerts(), fetchNotificationCounts()])
    setRefreshing(false)
    toast.success("Alerts refreshed")
  }

  // Update alert status
  const updateAlertStatus = async (alertId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success("Alert status updated")
        fetchAlerts()
        fetchNotificationCounts()
      } else {
        throw new Error("Failed to update alert")
      }
    } catch (error) {
      console.error("Error updating alert:", error)
      toast.error("Failed to update alert status")
    }
  }

  // Delete alert
  const deleteAlert = async (alertId: number) => {
    if (!confirm("Are you sure you want to delete this alert?")) return

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Alert deleted")
        fetchAlerts()
        fetchNotificationCounts()
      } else {
        throw new Error("Failed to delete alert")
      }
    } catch (error) {
      console.error("Error deleting alert:", error)
      toast.error("Failed to delete alert")
    }
  }

  // Fetch alerts on component mount and when filters change
  useEffect(() => {
    fetchAlerts()
    fetchNotificationCounts()
  }, [statusFilter, typeFilter])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAlerts()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "overdue":
        return "bg-red-100 text-red-800"
      case "due_today":
        return "bg-orange-100 text-orange-800"
      case "due_soon":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "sent":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "service_due":
        return "bg-purple-100 text-purple-800"
      case "warranty_expiring":
        return "bg-orange-100 text-orange-800"
      case "follow_up":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Bell className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Alert Management</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading alerts...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-4">
              <Bell className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Alert Management</h1>
              {notificationCounts && notificationCounts.notificationCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {notificationCounts.notificationCount}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Alerts are automatically generated from your service, vehicle, and warranty data</p>
          </div>
        </div>
                 <div className="flex space-x-2">
           <Button
             variant="outline"
             size="sm"
             onClick={handleRefresh}
             disabled={refreshing}
           >
             <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
             Refresh
           </Button>
         </div>
      </div>

      {/* Summary Cards */}
      {notificationCounts && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{notificationCounts.total_alerts}</div>
              <p className="text-xs text-muted-foreground">All alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{notificationCounts.pending_alerts}</div>
              <p className="text-xs text-muted-foreground">Require action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{notificationCounts.overdue_alerts}</div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{notificationCounts.due_today_alerts}</div>
              <p className="text-xs text-muted-foreground">Due today</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search alerts by customer, phone, or vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="service_due">Service Due</SelectItem>
                  <SelectItem value="warranty_expiring">Warranty</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
                 <CardHeader>
           <CardTitle>Service Alerts</CardTitle>
           <CardDescription>Automatically generated alerts from service schedules, warranty expirations, and follow-ups</CardDescription>
         </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg transition-colors duration-150
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  bg-white dark:bg-gray-900
                  border-gray-200 dark:border-gray-700
                  space-y-4 lg:space-y-0"
              >
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{alert.customer_name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {alert.customer_phone}
                        </div>
                        <div className="flex items-center">
                          <Car className="h-4 w-4 mr-1" />
                          {alert.vehicle_plate} - {alert.vehicle_model}
                        </div>
                        {alert.customer_email && (
                          <div className="flex items-center">
                            <span className="text-xs">{alert.customer_email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getTypeColor(alert.alert_type)}>
                        {alert.alert_type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </Badge>
                      <Badge className={getUrgencyColor(alert.urgency_level || "upcoming")}>
                        {alert.urgency_level?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Alert Date</p>
                      <p className="font-medium text-xs">
                        {new Date(alert.alert_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Days Until Due</p>
                      <p className="font-medium">
                        {alert.days_until_due !== undefined ? (
                          alert.days_until_due < 0 ?
                            `${Math.abs(alert.days_until_due)} days overdue` :
                            alert.days_until_due === 0 ?
                              "Due today" :
                              `${alert.days_until_due} days`
                        ) : "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Vehicle Info</p>
                      <p className="font-medium text-xs">
                        {alert.year} {alert.vehicle_model}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Message</p>
                      <p className="font-medium text-xs">
                        {alert.message || "No message"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateAlertStatus(alert.id, "sent")}
                    disabled={alert.status === "sent" || alert.status === "completed"}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mark Sent
                  </Button>
                  <FollowUpModal
                    alert={alert}
                    onFollowUpComplete={() => {
                      fetchAlerts()
                      fetchNotificationCounts()
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateAlertStatus(alert.id, "completed")}
                    disabled={alert.status === "completed"}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

                     {alerts.length === 0 && (
             <div className="text-center py-12">
               <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
               <p className="text-gray-500">
                 {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                   ? "No alerts found matching your search."
                   : "No alerts found. Run the auto-generation script to create alerts from your data."}
               </p>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  )
}
