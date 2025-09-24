"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Wrench,
  Package,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  X,
  Calendar,
  Shield,
  Bell,
  MessageSquare,
  HelpCircle,
} from "lucide-react"
import SidebarNotificationBadge from "@/components/sidebar-notification-badge"
import { API_ENDPOINTS } from "@/lib/api-config"

type SidebarProps =
  | {
      // Newer prop style
      open: boolean
      onToggle: () => void
      onClose?: () => void
      isOpen?: never
      setIsOpen?: never
    }
  | {
      // Your original prop style
      isOpen: boolean
      setIsOpen: (open: boolean) => void
      open?: never
      onToggle?: never
      onClose?: never
    }

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Services", href: "/services", icon: Wrench },
  { name: "Bookings", href: "/bookings", icon: Calendar },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Warranty", href: "/warranty", icon: Shield },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Follow-ups", href: "/notifications", icon: MessageSquare },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function Sidebar(props: SidebarProps) {
  const pathname = usePathname()

  // Normalize props
  const open = "open" in props ? props.open : props.isOpen
  const close = () => {
    if ("onClose" in props && props.onClose) return props.onClose()
    if ("setIsOpen" in props && props.setIsOpen) return props.setIsOpen(false)
    if ("onToggle" in props && props.onToggle) return props.onToggle()
  }

  const handleLogout = async () => {
    try {
      await fetch(API_ENDPOINTS.AUTH.LOGOUT, { method: "POST" })
    } finally {
      try {
        localStorage.removeItem("isAuthenticated")
        localStorage.removeItem("user")
      } catch {}
      window.location.href = "/login"
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />

      {/* Sidebar container */}
      <aside
        className={cn(
          "z-50 w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
          // Mobile: fixed drawer with slide-in
          "fixed inset-y-0 left-0 transform transition-transform duration-200 ease-in-out lg:transform-none lg:inset-auto",
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop: sticky + full viewport height, its own scroll if needed
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        )}
        aria-hidden={!open && typeof window !== "undefined" && window.innerWidth < 1024}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <img src="/Logo%20GTV.png" alt="GTV" style={{ height: 32, width: "auto" }} />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">GTV Motor</h1>
                <p className="text-gray-500 dark:text-gray-400">After Sales Management System</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={close}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation — allow internal scroll if items overflow */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start transition-all duration-200",
                      isActive
                        ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-sm"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
                    )}
                    onClick={close}
                  >
                                         <div className="relative mr-3 flex items-center justify-center">
                       {item.name === "Alerts" ? (
                         <SidebarNotificationBadge />
                       ) : (
                         <item.icon className="h-5 w-5" />
                       )}
                     </div>
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Support */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="mb-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                asChild
              >
                <a href="http://cghub.dev/" target="_blank" rel="noopener noreferrer">
                  <HelpCircle className="mr-3 h-5 w-5" />
                  Support
                </a>
              </Button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>Contact our team:</p>
              <p>
                <a
                  href="https://t.me/CG_RITHY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors duration-200"
                >
                  Telegram: @CG_RITHY
                </a>
              </p>
              <p>
                <a
                  href="http://cghub.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors duration-200"
                >
                  Website: cghub.dev
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900 dark:text-white">
                    Are you sure you want to logout?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                    You will be signed out of your account and redirected to the login page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 transition-colors duration-200"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </aside>
    </>
  )
}
