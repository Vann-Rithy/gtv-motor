"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, MapPin, Save, Loader2, Camera, Lock, Shield, Calendar, Edit2, X, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"
import { API_ENDPOINTS } from "@/lib/api-config"

export default function ProfilePage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    // Validation
    if (!formData.full_name || !formData.full_name.trim()) {
      toast.error("Full name is required")
      return
    }

    if (!formData.email || !formData.email.trim()) {
      toast.error("Email is required")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    try {
      setSaving(true)

      // Update profile information
      const updateData: any = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
      }

      if (formData.phone) updateData.phone = formData.phone.trim()
      if (formData.address) updateData.address = formData.address.trim()

      // Get token from localStorage
      const sessionData = localStorage.getItem('gtv_session')
      const session = sessionData ? JSON.parse(sessionData) : null
      const token = session?.token

      // Call API to update user profile
      const response = await fetch(`${API_ENDPOINTS.AUTH.ME}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const result = await response.json()
        const updatedUser = result.data || result

        // Update session with new user data
        if (session) {
          session.user = { ...session.user, ...updatedUser }
          localStorage.setItem('gtv_session', JSON.stringify(session))
        }

        if (refreshUser) {
          await refreshUser()
        }

        toast.success("Profile updated successfully")
        setIsEditing(false)
      } else {
        const errorData = await response.json().catch(() => ({ message: "Failed to update profile" }))
        throw new Error(errorData.message || "Failed to update profile")
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error?.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (formData.new_password !== formData.confirm_password) {
      toast.error("New passwords do not match")
      return
    }

    if (formData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    try {
      setSaving(true)

      // Get token from localStorage
      const sessionData = localStorage.getItem('gtv_session')
      const session = sessionData ? JSON.parse(sessionData) : null
      const token = session?.token

      // Call API to change password
      const response = await fetch(`${API_ENDPOINTS.AUTH.LOGIN}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
        body: JSON.stringify({
          current_password: formData.current_password,
          new_password: formData.new_password,
        }),
      })

      if (response.ok) {
        toast.success("Password changed successfully")
        setFormData(prev => ({
          ...prev,
          current_password: "",
          new_password: "",
          confirm_password: "",
        }))
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to change password")
      }
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast.error(error?.message || "Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!user) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('common.profile', 'My Profile')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your account information and preferences
            </p>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1 sm:flex-initial"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                // Reset form data
                if (user) {
                  setFormData({
                    full_name: user.full_name || "",
                    email: user.email || "",
                    phone: user.phone || "",
                    address: user.address || "",
                    current_password: "",
                    new_password: "",
                    confirm_password: "",
                  })
                }
              }}
              disabled={saving}
              className="flex-1 sm:flex-initial"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <Card className="lg:sticky lg:top-6 h-fit">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4 relative">
              <Avatar className="h-28 w-28 border-4 border-white dark:border-gray-800 shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-3xl font-bold">
                  {getUserInitials(user.full_name || user.username || "U")}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 shadow-md"
                  onClick={() => {
                    toast.info("Profile picture upload coming soon")
                  }}
                >
                  <Camera className="h-4 w-4 text-white" />
                </Button>
              )}
            </div>
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
              {user.full_name || user.username}
            </CardTitle>
            <div className="flex justify-center mt-2">
              <Badge variant="secondary" className="capitalize">
                {user.role || "User"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member since</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short'
                      })
                    : "N/A"}
                </p>
              </div>
              {user.last_login && (
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last login</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(user.last_login).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="border-2 border-transparent transition-all duration-200 hover:border-gray-200 dark:hover:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Personal Information
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Update your personal details and contact information
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Badge variant="outline" className="hidden sm:flex">
                    <Shield className="h-3 w-3 mr-1" />
                    Protected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-semibold">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`pl-11 h-11 ${!isEditing ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`pl-11 h-11 ${!isEditing ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`pl-11 h-11 ${!isEditing ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold">
                    Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`pl-11 h-11 ${!isEditing ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        // Reset form data
                        if (user) {
                          setFormData({
                            full_name: user.full_name || "",
                            email: user.email || "",
                            phone: user.phone || "",
                            address: user.address || "",
                            current_password: "",
                            new_password: "",
                            confirm_password: "",
                          })
                        }
                        toast.info("Changes discarded")
                      }}
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-2 border-transparent transition-all duration-200 hover:border-gray-200 dark:hover:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/20 pb-4">
              <div>
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                    <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  Change Password
                </CardTitle>
                <CardDescription className="mt-2">
                  Update your password to keep your account secure
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="current_password" className="text-sm font-semibold">
                    Current Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="current_password"
                    name="current_password"
                    type="password"
                    value={formData.current_password}
                    onChange={handleInputChange}
                    className="h-11"
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password" className="text-sm font-semibold">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={handleInputChange}
                    className="h-11"
                    placeholder="Enter new password (min. 8 characters)"
                  />
                  <div className="flex items-start space-x-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Password must be at least 8 characters long and contain a mix of letters and numbers
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-sm font-semibold">
                    Confirm New Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    className="h-11"
                    placeholder="Confirm your new password"
                  />
                  {formData.new_password && formData.confirm_password && formData.new_password !== formData.confirm_password && (
                    <p className="text-xs text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleChangePassword}
                  disabled={saving || !formData.current_password || !formData.new_password || !formData.confirm_password || formData.new_password !== formData.confirm_password}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card className="border-2 border-transparent transition-all duration-200 hover:border-gray-200 dark:hover:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 pb-4">
              <div>
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Account Security
                </CardTitle>
                <CardDescription className="mt-2">
                  View your account security information and status
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    User ID
                  </Label>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-2">
                    {user.id || "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Role
                  </Label>
                  <div className="mt-2">
                    <Badge variant="secondary" className="capitalize">
                      {user.role || "User"}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Username
                  </Label>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-2">
                    {user.username || "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Account Status
                  </Label>
                  <div className="mt-2">
                    <Badge
                      variant={user.is_active ? "default" : "destructive"}
                      className="capitalize"
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              {user.last_login && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <Label className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      Last Login
                    </Label>
                  </div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mt-2">
                    {new Date(user.last_login).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

