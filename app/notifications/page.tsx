"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Bell, MessageSquare, Mail, Phone, Plus, User, Calendar, Send } from "lucide-react"

interface Notification {
  id: string
  type: "sms" | "email" | "system"
  recipient: string
  subject: string
  message: string
  status: "sent" | "pending" | "failed"
  sentAt: string
  customerName: string
}

interface FollowUpRecord {
  id: string
  customerName: string
  phone: string
  vehicleInfo: string
  serviceDate: string
  followUpDate: string
  contactMethod: "phone" | "visit" | "sms"
  reason: string
  issues: string
  resolution: string
  status: "pending" | "contacted" | "resolved"
  staffName: string
  notes: string
}

export default function NotificationsPage() {
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      type: "sms",
      recipient: "883176894",
      subject: "Service Reminder",
      message: "Dear Poeng Lim, your SOBEN 2CD-7960 is due for oil change service. Please contact us to schedule.",
      status: "sent",
      sentAt: "2025-07-15 14:30",
      customerName: "Poeng Lim",
    },
    {
      id: "2",
      type: "email",
      recipient: "vithboven@email.com",
      subject: "Service Completed",
      message: "Your vehicle service has been completed. Invoice SR25-0206 is ready for pickup.",
      status: "sent",
      sentAt: "2025-07-14 16:45",
      customerName: "Vith Boven",
    },
    {
      id: "3",
      type: "sms",
      recipient: "10993436",
      subject: "Warranty Expiring",
      message: "Your vehicle warranty expires in 2 months. Contact us for renewal options.",
      status: "pending",
      sentAt: "",
      customerName: "San Channoeun",
    },
  ])

  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([
    {
      id: "1",
      customerName: "Poeng Lim",
      phone: "883176894",
      vehicleInfo: "SOBEN 2CD-7960",
      serviceDate: "2025-07-10",
      followUpDate: "2025-07-17",
      contactMethod: "phone",
      reason: "Service quality check",
      issues: "Customer mentioned slight noise after oil change",
      resolution: "Scheduled re-inspection, adjusted engine mount",
      status: "resolved",
      staffName: "Yem Kunthea",
      notes: "Customer satisfied with resolution",
    },
    {
      id: "2",
      customerName: "Vith Boven",
      phone: "99411455",
      vehicleInfo: "SOBEN 2CF-6609",
      serviceDate: "2025-06-17",
      followUpDate: "2025-07-15",
      contactMethod: "phone",
      reason: "Follow up on check-up service",
      issues: "No issues reported",
      resolution: "Customer satisfied with service",
      status: "contacted",
      staffName: "Tey Sreylin",
      notes: "Customer happy with service quality",
    },
  ])

  const [newNotification, setNewNotification] = useState({
    type: "sms",
    recipient: "",
    subject: "",
    message: "",
    customerName: "",
  })

  const [newFollowUp, setNewFollowUp] = useState({
    customerName: "",
    phone: "",
    vehicleInfo: "",
    serviceDate: "",
    followUpDate: "",
    contactMethod: "phone",
    reason: "",
    issues: "",
    resolution: "",
    staffName: "",
    notes: "",
  })

  const handleSendNotification = () => {
    console.log("Sending notification:", newNotification)
    alert("Notification sent successfully!")
    setNewNotification({
      type: "sms",
      recipient: "",
      subject: "",
      message: "",
      customerName: "",
    })
  }

  const handleAddFollowUp = () => {
    const followUp: FollowUpRecord = {
      id: Date.now().toString(),
      ...newFollowUp,
      status: "pending",
    }
    setFollowUps([...followUps, followUp])
    setNewFollowUp({
      customerName: "",
      phone: "",
      vehicleInfo: "",
      serviceDate: "",
      followUpDate: "",
      contactMethod: "phone",
      reason: "",
      issues: "",
      resolution: "",
      staffName: "",
      notes: "",
    })
    alert("Follow-up record added successfully!")
  }

  const updateFollowUpStatus = (id: string, status: "pending" | "contacted" | "resolved") => {
    setFollowUps(followUps.map((f) => (f.id === id ? { ...f, status } : f)))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "contacted":
        return <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">Contacted</Badge>
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "system":
        return <Bell className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case "phone":
        return <Phone className="h-4 w-4" />
      case "visit":
        return <User className="h-4 w-4" />
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Phone className="h-4 w-4" />
    }
  }

  const sentNotifications = notifications.filter((n) => n.status === "sent").length
  const pendingNotifications = notifications.filter((n) => n.status === "pending").length
  const failedNotifications = notifications.filter((n) => n.status === "failed").length

  const pendingFollowUps = followUps.filter((f) => f.status === "pending").length
  const contactedFollowUps = followUps.filter((f) => f.status === "contacted").length
  const resolvedFollowUps = followUps.filter((f) => f.status === "resolved").length

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center space-x-4">
        <Bell className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Customer Follow-up System</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sentNotifications}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
            <Bell className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingFollowUps}</div>
            <p className="text-xs text-muted-foreground">Need to contact</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted</CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{contactedFollowUps}</div>
            <p className="text-xs text-muted-foreground">Already contacted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedFollowUps}</div>
            <p className="text-xs text-muted-foreground">Issues resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Phone className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedNotifications}</div>
            <p className="text-xs text-muted-foreground">Delivery failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Send New Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Send New Notification
          </CardTitle>
          <CardDescription>Send SMS or email notifications to customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notificationType">Notification Type</Label>
              <Select
                value={newNotification.type}
                onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={newNotification.customerName}
                onChange={(e) => setNewNotification({ ...newNotification, customerName: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label htmlFor="recipient">{newNotification.type === "sms" ? "Phone Number" : "Email Address"}</Label>
              <Input
                id="recipient"
                value={newNotification.recipient}
                onChange={(e) => setNewNotification({ ...newNotification, recipient: e.target.value })}
                placeholder={newNotification.type === "sms" ? "Enter phone number" : "Enter email address"}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={newNotification.subject}
                onChange={(e) => setNewNotification({ ...newNotification, subject: e.target.value })}
                placeholder="Enter subject"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={newNotification.message}
              onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
              placeholder="Enter your message..."
              rows={4}
            />
          </div>
          <Button onClick={handleSendNotification}>
            <Send className="mr-2 h-4 w-4" />
            Send Notification
          </Button>
        </CardContent>
      </Card>

      {/* Add New Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Add Customer Follow-up Record
          </CardTitle>
          <CardDescription>Record customer follow-up calls and feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={newFollowUp.customerName}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, customerName: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={newFollowUp.phone}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="vehicleInfo">Vehicle Information</Label>
              <Input
                id="vehicleInfo"
                value={newFollowUp.vehicleInfo}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, vehicleInfo: e.target.value })}
                placeholder="e.g., SOBEN 2CD-7960"
              />
            </div>
            <div>
              <Label htmlFor="serviceDate">Service Date</Label>
              <Input
                id="serviceDate"
                type="date"
                value={newFollowUp.serviceDate}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, serviceDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="followUpDate">Follow-up Date</Label>
              <Input
                id="followUpDate"
                type="date"
                value={newFollowUp.followUpDate}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, followUpDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contactMethod">Contact Method</Label>
              <Select
                value={newFollowUp.contactMethod}
                onValueChange={(value) => setNewFollowUp({ ...newFollowUp, contactMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="visit">Customer Visit</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="staffName">Staff Name</Label>
              <Input
                id="staffName"
                value={newFollowUp.staffName}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, staffName: e.target.value })}
                placeholder="Enter staff name"
              />
            </div>
            <div>
              <Label htmlFor="reason">Follow-up Reason</Label>
              <Input
                id="reason"
                value={newFollowUp.reason}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, reason: e.target.value })}
                placeholder="Reason for follow-up"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="issues">Issues/Problems Reported</Label>
            <Textarea
              id="issues"
              value={newFollowUp.issues}
              onChange={(e) => setNewFollowUp({ ...newFollowUp, issues: e.target.value })}
              placeholder="Describe any issues or problems reported by customer..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="resolution">Resolution/Action Taken</Label>
            <Textarea
              id="resolution"
              value={newFollowUp.resolution}
              onChange={(e) => setNewFollowUp({ ...newFollowUp, resolution: e.target.value })}
              placeholder="Describe the resolution or action taken..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="notes">Additional Description</Label>
            <Textarea
              id="notes"
              value={newFollowUp.notes}
              onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
              placeholder="Any additional description..."
              rows={2}
            />
          </div>
          <Button onClick={handleAddFollowUp}>
            <Plus className="mr-2 h-4 w-4" />
            Add Follow-up Record
          </Button>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>View all sent and pending notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 space-y-4 lg:space-y-0"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getTypeIcon(notification.type)}
                    <span className="font-medium capitalize">{notification.type}</span>
                    {getStatusBadge(notification.status)}
                  </div>

                  <h3 className="font-semibold mb-1">{notification.subject}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{notification.message}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Customer:</span> {notification.customerName}
                    </div>
                    <div>
                      <span className="font-medium">Recipient:</span> {notification.recipient}
                    </div>
                    <div>
                      <span className="font-medium">Sent:</span> {notification.sentAt || "Not sent"}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {notification.status === "pending" && (
                    <Button size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </Button>
                  )}
                  {notification.status === "failed" && (
                    <Button size="sm" variant="outline">
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No notifications found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follow-up Records */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Records</CardTitle>
          <CardDescription>Customer follow-up history and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {followUps.map((followUp) => (
              <div
                key={followUp.id}
                className="flex flex-col lg:flex-row lg:items-start justify-between p-4 border rounded-lg hover:bg-gray-50 space-y-4 lg:space-y-0"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{followUp.customerName}</h3>
                    {getStatusBadge(followUp.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 mr-2" />
                      {followUp.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Vehicle:</span>
                      <span className="ml-2">{followUp.vehicleInfo}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      Service: {followUp.serviceDate}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      Follow-up: {followUp.followUpDate}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      {getContactMethodIcon(followUp.contactMethod)}
                      <span className="ml-2 capitalize">{followUp.contactMethod}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4 mr-2" />
                      {followUp.staffName}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Reason:</span>
                      <p className="text-gray-600">{followUp.reason}</p>
                    </div>
                    {followUp.issues && (
                      <div>
                        <span className="font-medium text-gray-700">Issues:</span>
                        <p className="text-gray-600">{followUp.issues}</p>
                      </div>
                    )}
                    {followUp.resolution && (
                      <div>
                        <span className="font-medium text-gray-700">Resolution:</span>
                        <p className="text-gray-600">{followUp.resolution}</p>
                      </div>
                    )}
                    {followUp.notes && (
                      <div>
                        <span className="font-medium text-gray-700">Notes:</span>
                        <p className="text-gray-600">{followUp.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                  {followUp.status === "pending" && (
                    <Button size="sm" onClick={() => updateFollowUpStatus(followUp.id, "contacted")}>
                      Mark Contacted
                    </Button>
                  )}
                  {followUp.status === "contacted" && (
                    <Button size="sm" onClick={() => updateFollowUpStatus(followUp.id, "resolved")}>
                      Mark Resolved
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {followUps.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No follow-up records found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
