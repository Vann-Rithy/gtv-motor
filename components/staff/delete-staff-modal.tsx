import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Staff {
  id: number
  name: string
  role: string
  phone: string
  email: string
  active: boolean
}

interface DeleteStaffModalProps {
  isOpen: boolean
  onClose: () => void
  staff: Staff | null
  onConfirmDelete: (staffId: number) => Promise<void>
  isDeleting: boolean
}

export function DeleteStaffModal({
  isOpen,
  onClose,
  staff,
  onConfirmDelete,
  isDeleting
}: DeleteStaffModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirmDelete = async () => {
    if (!staff) return
    
    setIsConfirming(true)
    try {
      await onConfirmDelete(staff.id)
      onClose()
    } catch (error) {
      console.error("Error deleting staff:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting && !isConfirming) {
      onClose()
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (event.key) {
        case 'Escape':
          handleClose()
          break
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handleConfirmDelete()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDeleting, isConfirming])

  if (!staff) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Staff Member
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently remove the staff member from the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Staff Information */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{staff.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {staff.role.replace("_", " ")}
                  </Badge>
                  <Badge variant={staff.active ? "default" : "secondary"}>
                    {staff.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {staff.email && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span>{staff.email}</span>
                </div>
              )}
              {staff.phone && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Phone:</span>
                  <span>{staff.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive mb-1">Warning</p>
              <p className="text-muted-foreground">
                Deleting this staff member will:
              </p>
              <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                <li>Remove their access to the system</li>
                <li>Hide them from staff listings</li>
                <li>Preserve their historical data</li>
              </ul>
            </div>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
            <p>💡 <strong>Keyboard shortcuts:</strong> Esc to cancel, Ctrl+Enter to confirm</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting || isConfirming}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting || isConfirming}
            className="gap-2"
          >
            {isDeleting || isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Staff Member
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
