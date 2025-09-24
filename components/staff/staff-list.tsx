import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Trash2, User, Edit, MoreHorizontal } from "lucide-react"
import { DeleteStaffModal } from "./delete-staff-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Staff {
  id: number
  name: string
  role: string
  phone: string
  email: string
  active: boolean
  created_at: string
}

interface StaffListProps {
  staff: Staff[]
  onToggleStatus: (staffId: number, active: boolean) => Promise<void>
  onDelete: (staffId: number) => Promise<void>
  onEdit?: (staff: Staff) => void
  showActions?: boolean
}

export function StaffList({ 
  staff, 
  onToggleStatus, 
  onDelete, 
  onEdit,
  showActions = true 
}: StaffListProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (staffMember: Staff) => {
    setStaffToDelete(staffMember)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async (staffId: number) => {
    setIsDeleting(true)
    try {
      await onDelete(staffId)
      setDeleteModalOpen(false)
      setStaffToDelete(null)
    } catch (error) {
      console.error("Error deleting staff:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'service_advisor':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'technician':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (staff.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Staff Members</h3>
          <p className="text-sm text-muted-foreground text-center">
            Get started by adding your first staff member to the system.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {staff.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {/* Staff Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge 
                        variant="outline" 
                        className={`${getRoleColor(member.role)} border`}
                      >
                        {formatRole(member.role)}
                      </Badge>
                      <Badge variant={member.active ? "default" : "secondary"}>
                        {member.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {member.email && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Email:</span>
                          {member.email}
                        </span>
                      )}
                      {member.phone && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Phone:</span>
                          {member.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Switch 
                        checked={member.active} 
                        onCheckedChange={(checked) => onToggleStatus(member.id, checked)}
                        aria-label={`Toggle ${member.name} status`}
                      />
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(member)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Staff Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(member)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Staff Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteStaffModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        staff={staffToDelete}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  )
}
