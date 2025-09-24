"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageSquare, Calendar, Car, User, Mail } from "lucide-react"
import { ServiceAlertWithDetails } from "@/lib/types"
import { toast } from "sonner"

interface FollowUpModalProps {
  alert: ServiceAlertWithDetails
  onFollowUpComplete: () => void
}

export default function FollowUpModal({ alert, onFollowUpComplete }: FollowUpModalProps) {
  const [open, setOpen] = useState(false)
  const [followUpType, setFollowUpType] = useState("phone")
  const [followUpNotes, setFollowUpNotes] = useState("")
  const [followUpDate, setFollowUpDate] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!followUpNotes.trim() || !followUpDate) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      // Update alert status to completed
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "completed",
          message: `${alert.message}\n\nFollow-up completed on ${followUpDate} via ${followUpType}:\n${followUpNotes}`
        })
      })

      if (response.ok) {
        toast.success("Follow-up completed successfully")
        setOpen(false)
        onFollowUpComplete()
        
        // Reset form
        setFollowUpType("phone")
        setFollowUpNotes("")
        setFollowUpDate("")
      } else {
        throw new Error("Failed to complete follow-up")
      }
    } catch (error) {
      console.error("Error completing follow-up:", error)
      toast.error("Failed to complete follow-up")
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "overdue":
        return "bg-red-100 text-red-800"
      case "due_today":
        return "bg-orange-100 text-orange-800"
      case "due_soon":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Follow Up
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Follow-up</DialogTitle>
          <DialogDescription>
            Complete follow-up for {alert.customer_name} regarding {alert.alert_type.replace("_", " ")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Alert Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Customer:</span>
                <span>{alert.customer_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Phone:</span>
                <span>{alert.customer_phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Vehicle:</span>
                <span>{alert.vehicle_plate} - {alert.vehicle_model}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Due Date:</span>
                <span>{new Date(alert.alert_date).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-3">
              <Badge className={getUrgencyColor(alert.urgency_level || "upcoming")}>
                {alert.urgency_level?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
          </div>

          {/* Follow-up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Follow-up Method</label>
                <Select value={followUpType} onValueChange={setFollowUpType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="visit">In-person Visit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Follow-up Date</label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Follow-up Description</label>
              <Textarea
                placeholder="Describe the follow-up action taken, customer response, and next steps..."
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Completing..." : "Complete Follow-up"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
