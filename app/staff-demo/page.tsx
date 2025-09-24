"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Settings } from "lucide-react"
import { StaffList } from "@/components/staff/staff-list"

// Mock staff data for demo
const mockStaff = [
  {
    id: 1,
    name: "Sok Channtrea",
    role: "manager",
    phone: "012345678",
    email: "channtrea@gtvmotors.com",
    active: true,
    created_at: "2024-01-15"
  },
  {
    id: 2,
    name: "Yem Kunthea",
    role: "service_advisor",
    phone: "012345679",
    email: "kunthea@gtvmotors.com",
    active: true,
    created_at: "2024-02-01"
  },
  {
    id: 3,
    name: "Sok Chea",
    role: "technician",
    phone: "012345681",
    email: "sokchea@gtvmotors.com",
    active: true,
    created_at: "2024-01-20"
  },
  {
    id: 4,
    name: "Kim Sopheak",
    role: "admin",
    phone: "012345682",
    email: "sopheak@gtvmotors.com",
    active: false,
    created_at: "2024-03-01"
  }
]

export default function StaffDemoPage() {
  const [staff, setStaff] = useState(mockStaff)

  const handleToggleStatus = async (staffId: number, active: boolean) => {
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, active } : s))
  }

  const handleDelete = async (staffId: number) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setStaff(prev => prev.filter(s => s.id !== staffId))
  }

  const handleEdit = (staff: any) => {
    alert(`Edit staff member: ${staff.name}`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center space-x-4">
        <Users className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Staff Management Demo</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demo Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Demo Features
              </CardTitle>
              <CardDescription>
                Interactive demonstration of the staff management system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">What you can do:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Toggle staff active/inactive status</li>
                  <li>• Delete staff members with confirmation modal</li>
                  <li>• View role-based color coding</li>
                  <li>• Use keyboard shortcuts (Esc, Ctrl+Enter)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Keyboard Shortcuts:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Esc</Badge>
                    <span>Cancel/Close modal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Ctrl+Enter</Badge>
                    <span>Confirm delete action</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.location.href = '/settings'}
                >
                  Go to Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Members
              </CardTitle>
              <CardDescription>
                Manage your team members. Try deleting someone to see the modal in action!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StaffList
                staff={staff}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
                onEdit={handleEdit}
                showActions={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
