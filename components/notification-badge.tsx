"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { API_ENDPOINTS } from "@/lib/api-config"

interface NotificationCounts {
  notificationCount: number
}

export default function NotificationBadge() {
  const [notificationCount, setNotificationCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.NOTIFICATIONS)
        if (response.ok) {
          const data = await response.json()
          setNotificationCount(data.notificationCount || 0)
        }
      } catch (error) {
        console.error("Error fetching notification count:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotificationCount()

    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return null
  }

  if (notificationCount === 0) {
    return (
      <div className="relative">
        <Bell className="h-5 w-5 text-gray-600" />
      </div>
    )
  }

  return (
    <div className="relative">
      <Bell className="h-5 w-5 text-gray-600" />
      <div className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
        <span className="text-white text-[10px] font-bold leading-none">
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      </div>
    </div>
  )
}
