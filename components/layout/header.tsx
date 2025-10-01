"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu, User, LogOut, Settings } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/lib/language-context"
import SidebarNotificationBadge from "@/components/sidebar-notification-badge"

interface HeaderProps {
  onToggleSidebar?: () => void
  onMenuClick?: () => void
  user?: any
}

export default function Header({ onToggleSidebar, onMenuClick, user: propUser }: HeaderProps) {
  const { user: authUser, logout } = useAuth()
  const { t } = useLanguage()
  const user = propUser || authUser

  const handleLogout = async () => {
    await logout()
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick || onToggleSidebar}
          className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Desktop Logo/Brand */}
        <div className="hidden lg:flex items-center">
          <img src="/Logo GTV Motor eng&kh.png" alt="GTV Motor" className="h-8 w-auto" />
        </div>

        <div className="flex items-center space-x-1">
          {/* Notification Badge */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            asChild
          >
            <a href="/alerts">
              <SidebarNotificationBadge />
            </a>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Switcher */}
          <LanguageSwitcher />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getUserInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('common.profile', 'Profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('nav.settings', 'Settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('nav.logout', 'Log out')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
