"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, User, Bell, Database, Save, Plus, Loader2 } from "lucide-react"
import { useSettings } from "@/hooks/use-settings"
import { StaffList } from "@/components/staff/staff-list"

export default function SettingsPage() {
  const {
    companySettings,
    systemConfig,
    notificationSettings,
    staff,
    loading,
    saving,
    saveCompanySettings,
    saveSystemConfig,
    saveNotificationSettings,
    addStaffMember,
    removeStaffMember,
    toggleStaffStatus
  } = useSettings()

  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
  })

  const handleSaveCompany = async () => {
    if (companySettings) {
      await saveCompanySettings(companySettings)
    }
  }

  const handleSaveNotifications = async () => {
    if (notificationSettings) {
      await saveNotificationSettings(notificationSettings)
    }
  }

  const handleSaveSystem = async () => {
    if (systemConfig) {
      await saveSystemConfig(systemConfig)
    }
  }

  const handleAddStaff = async () => {
    if (newStaff.name && newStaff.role) {
      const success = await addStaffMember(newStaff)
      if (success) {
        setNewStaff({ name: "", role: "", phone: "", email: "" })
      }
    }
  }

  // Update local state when API data changes
  const updateCompanySettings = (field: string, value: string) => {
    if (companySettings) {
      const updated = { ...companySettings, [field]: value }
      // Update the hook's state
      Object.assign(companySettings, updated)
    }
  }

  const updateSystemSettings = (field: string, value: any) => {
    if (systemConfig) {
      const updated = { ...systemConfig, [field]: value }
      // Update the hook's state
      Object.assign(systemConfig, updated)
    }
  }

  const updateNotificationSettings = (field: string, value: boolean) => {
    if (notificationSettings) {
      const updated = { ...notificationSettings, [field]: value }
      // Update the hook's state
      Object.assign(notificationSettings, updated)
    }
  }

  // Show loading state if data is not yet loaded
  if (loading.company || loading.system || loading.notifications || loading.staff) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">System Settings</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center space-x-4">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">System Settings</h1>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Manage your company details and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companySettings?.company_name || ""}
                    onChange={(e) => updateCompanySettings("company_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={companySettings?.tax_id || ""}
                    onChange={(e) => updateCompanySettings("tax_id", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={companySettings?.phone || ""}
                    onChange={(e) => updateCompanySettings("phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings?.email || ""}
                    onChange={(e) => updateCompanySettings("email", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={companySettings?.address || ""}
                  onChange={(e) => updateCompanySettings("address", e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveCompany} disabled={saving.company}>
                {saving.company ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Company Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.email_notifications || false}
                    onCheckedChange={(checked) => updateNotificationSettings("email_notifications", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.sms_notifications || false}
                    onCheckedChange={(checked) => updateNotificationSettings("sms_notifications", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Service Reminders</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automatic service reminder notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.service_reminders || false}
                    onCheckedChange={(checked) => updateNotificationSettings("service_reminders", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when inventory is low</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.low_stock_alerts || false}
                    onCheckedChange={(checked) => updateNotificationSettings("low_stock_alerts", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Warranty Expiry Alerts</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notifications for expiring warranties</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.warranty_expiry || false}
                    onCheckedChange={(checked) => updateNotificationSettings("warranty_expiry", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Reports</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive daily summary reports</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.daily_reports || false}
                    onCheckedChange={(checked) => updateNotificationSettings("daily_reports", checked)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveNotifications} disabled={saving.notifications}>
                {saving.notifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={systemConfig?.currency || "USD"}
                    onValueChange={(value) => updateSystemSettings("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="KHR">KHR - Cambodian Riel</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={systemConfig?.date_format || "DD/MM/YYYY"}
                    onValueChange={(value) => updateSystemSettings("date_format", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select
                    value={systemConfig?.time_format || "24h"}
                    onValueChange={(value) => updateSystemSettings("time_format", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 Hour</SelectItem>
                      <SelectItem value="12h">12 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={systemConfig?.language || "en"}
                    onValueChange={(value) => updateSystemSettings("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="km">Khmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-gray-500">Automatically backup data daily</p>
                  </div>
                  <Switch
                    checked={systemConfig?.auto_backup || false}
                    onCheckedChange={(checked) => updateSystemSettings("auto_backup", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">Enable maintenance mode for system updates</p>
                  </div>
                  <Switch
                    checked={systemConfig?.maintenance_mode || false}
                    onCheckedChange={(checked) => updateSystemSettings("maintenance_mode", checked)}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSystem} disabled={saving.system}>
                {saving.system ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save System Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Management */}
        <TabsContent value="staff">
          <div className="space-y-6">
            {/* Add New Staff */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Add New Staff Member
                </CardTitle>
                <CardDescription>Add new team members to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="staffName">Full Name</Label>
                    <Input
                      id="staffName"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="staffRole">Role</Label>
                    <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="service_advisor">Service Advisor</SelectItem>
                        <SelectItem value="technician">Technician</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="staffPhone">Phone Number</Label>
                    <Input
                      id="staffPhone"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="staffEmail">Email Address</Label>
                    <Input
                      id="staffEmail"
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={handleAddStaff} disabled={saving.staff}>
                    {saving.staff ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Staff Member
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Staff List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Staff Members
                </CardTitle>
                <CardDescription>Manage existing staff members</CardDescription>
              </CardHeader>
              <CardContent>
                <StaffList
                  staff={staff}
                  onToggleStatus={toggleStaffStatus}
                  onDelete={removeStaffMember}
                  showActions={true}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
