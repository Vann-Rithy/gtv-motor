"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Play, Calendar, Clock, User, Car, Phone, Wrench, FileText } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Booking {
  id: number
  customer_name: string
  customer_phone: string
  vehicle_plate: string
  vehicle_model: string
  service_type_name: string
  booking_date: string
  booking_time: string
  status: string
  notes: string
  created_at: string
}

export default function BookingDetail() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)

  // Load booking data
  const loadBooking = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getBooking(Number(bookingId))
      setBooking(response.data)
    } catch (error) {
      console.error("Failed to load booking:", error)
      toast.error("Failed to load booking data")
      router.push("/bookings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooking()
  }, [bookingId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "in_progress":
        return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "no_show":
        return <Badge className="bg-gray-100 text-gray-800">No Show</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleEditBooking = () => {
    router.push(`/bookings/${bookingId}/edit`)
  }

  const handleStartService = async () => {
    if (!booking) return

    try {
      await apiClient.updateBooking(booking.id, {
        ...booking,
        status: "in_progress"
      })
      
      toast.success(`Started service for ${booking.customer_name}`)
      loadBooking() // Refresh the data
    } catch (error) {
      console.error("Failed to start service:", error)
      toast.error("Failed to start service")
    }
  }

  const handleCreateService = () => {
    router.push(`/services/new?booking_id=${bookingId}`)
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading booking...</span>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">Booking not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Booking Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEditBooking}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {booking.status === "confirmed" && (
            <Button onClick={handleStartService}>
              <Play className="h-4 w-4 mr-2" />
              Start Service
            </Button>
          )}
          {booking.status === "in_progress" && (
            <Button variant="secondary" onClick={handleCreateService}>
              <Wrench className="h-4 w-4 mr-2" />
              Create Service
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Customer Name</label>
              <p className="text-lg font-semibold">{booking.customer_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone Number</label>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {booking.customer_phone}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Plate Number</label>
              <p className="text-lg font-semibold">{booking.vehicle_plate}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Model</label>
              <p>{booking.vehicle_model}</p>
            </div>
          </CardContent>
        </Card>

        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                {getStatusBadge(booking.status)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Booking Date</label>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(booking.booking_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Booking Time</label>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {booking.booking_time}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Service Type</label>
              <p className="text-lg font-semibold">{booking.service_type_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p>{new Date(booking.created_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {booking.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{booking.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Available actions for this booking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleEditBooking}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Booking
            </Button>
            {booking.status === "confirmed" && (
              <Button onClick={handleStartService}>
                <Play className="h-4 w-4 mr-2" />
                Start Service
              </Button>
            )}
            {booking.status === "in_progress" && (
              <Button variant="secondary" onClick={handleCreateService}>
                <Wrench className="h-4 w-4 mr-2" />
                Create Service Record
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/bookings")}>
              Back to Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
