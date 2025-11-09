"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Plus, Loader2 } from "lucide-react"
import { useSettings } from "@/hooks/use-settings"
import { useLanguage } from "@/lib/language-context"
import { StaffList } from "@/components/staff/staff-list"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { t } = useLanguage()
  const {
    staff,
    loading,
    saving,
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

  const { toast } = useToast()

  const handleAddStaff = async () => {
    if (newStaff.name && newStaff.role) {
      const success = await addStaffMember(newStaff)
      if (success) {
        setNewStaff({ name: "", role: "", phone: "", email: "" })
        toast({
          title: "Success",
          description: "Staff member added successfully",
        })
      }
    }
  }

  // Show loading state if data is not yet loaded
  if (loading.staff) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <User className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Staff Control</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading staff...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center space-x-4">
        <User className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Staff Control</h1>
      </div>

        {/* Staff Management */}
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
              onToggleStatus={async (staffId: number, active: boolean) => {
                await toggleStaffStatus(staffId, active)
              }}
              onDelete={async (staffId: number) => {
                await removeStaffMember(staffId)
              }}
                  showActions={true}
                />
              </CardContent>
            </Card>
          </div>
    </div>
  )
}
