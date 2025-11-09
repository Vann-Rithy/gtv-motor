"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { API_ENDPOINTS } from "@/lib/api-config"

interface NotificationCounts {
  counts?: {
    pending_alerts?: number
    total_alerts?: number
    overdue_alerts?: number
    due_today_alerts?: number
  }
}

export default function SidebarNotificationBadge() {
  const [notificationCount, setNotificationCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.ALERTS_NOTIFICATIONS)
        if (response.ok) {
          const data = await response.json()
          // Get pending alerts count from the API response
          const counts = data.data?.counts || data.counts
          const pendingCount = counts?.pending_alerts || 0
          const overdueCount = counts?.overdue_alerts || 0
          const dueTodayCount = counts?.due_today_alerts || 0

          // Show total of pending, overdue, and due today alerts
          const totalCount = pendingCount + overdueCount + dueTodayCount

          // Trigger animation if count changed
          setNotificationCount((prevCount) => {
            if (totalCount !== prevCount && prevCount > 0) {
              setIsAnimating(true)
              setTimeout(() => setIsAnimating(false), 300)
            }
            return totalCount
          })
        }
      } catch (error) {
        console.error("Error fetching notification count:", error)
        setNotificationCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchNotificationCount()

    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300 transition-colors duration-200" />
      </div>
    )
  }

  // No notifications
  if (notificationCount === 0) {
    return (
      <div className="flex items-center gap-2 group">
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300 transition-all duration-200 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
      </div>
    )
  }

  // Has notifications - show badge next to icon
  return (
    <div className="flex items-center gap-2 group">
      {/* Bell Icon - fully visible */}
      <Bell className={`h-5 w-5 text-gray-700 dark:text-gray-200 transition-all duration-200 group-hover:text-gray-900 dark:group-hover:text-white group-hover:scale-110 ${isAnimating ? 'animate-pulse' : ''}`} />

      {/* Notification Badge - positioned next to icon */}
      <div
        className={`relative min-w-[22px] h-[22px] px-1.5 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800 transition-all duration-300 ${
          isAnimating ? 'animate-bounce scale-110' : 'group-hover:scale-105'
        }`}
      >
        <span className="text-white text-[11px] font-bold leading-none tracking-tight">
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>

        {/* Pulse animation ring for urgent notifications */}
        <div className="absolute inset-0 rounded-full bg-red-500/30 dark:bg-red-600/30 animate-ping" />
      </div>
    </div>
  )
}
