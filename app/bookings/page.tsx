"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Car, Phone, Plus, Search, Edit, Play, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Booking {
  id: number
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  customer_address: string | null
  vehicle_plate: string | null
  vehicle_model: string | null
  vehicle_vin: string | null
  vehicle_year: string | null
  service_type_name: string
  booking_date: string
  booking_time: string
  status: "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"
  notes: string | null
  created_at: string
}

export default function Bookings() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [startingService, setStartingService] = useState<number | null>(null)

  // Load bookings data
  const loadBookings = async () => {
    try {
      setLoading(true)
      const params: any = {}
      
      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await apiClient.getBookings(params)
      setBookings(response.data || [])
    } catch (error) {
      console.error("Failed to load bookings:", error)
      toast.error("Failed to load bookings data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [searchTerm])

  const filteredBookings = bookings.filter(
    (booking) => {
      const customerName = booking.customer_name || ""
      const customerPhone = booking.customer_phone || ""
      const vehiclePlate = booking.vehicle_plate || ""
      
      return customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             customerPhone.includes(searchTerm) ||
             vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())
    }
  )

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

  const todayBookings = bookings.filter((b) => b.booking_date === new Date().toISOString().split("T")[0])
  const upcomingBookings = bookings.filter((b) => new Date(b.booking_date) > new Date())
  const inProgressBookings = bookings.filter((b) => b.status === "in_progress")

  const handleEditBooking = (booking: Booking) => {
    router.push(`/bookings/${booking.id}/edit`)
  }

  const handleStartService = async (booking: Booking) => {
    try {
      setStartingService(booking.id)
      console.log("Starting service for booking:", booking.id)
      
      // Try to update booking status to in_progress
      try {
        const updateResponse = await apiClient.updateBooking(booking.id, {
          status: "in_progress"
        })
        
        if (updateResponse.data) {
          toast.success(`Started service for ${booking.customer_name || 'Customer'}`)
          // Refresh the bookings list
          await loadBookings()
        } else {
          toast.success(`Starting service for ${booking.customer_name || 'Customer'}`)
        }
      } catch (statusError) {
        console.warn("Could not update booking status (database schema may need update):", statusError)
        toast.success(`Starting service for ${booking.customer_name || 'Customer'}`)
      }
      
      // Redirect to service creation with booking data
      router.push(`/services/new?booking_id=${booking.id}`)
    } catch (error) {
      console.error("Failed to start service:", error)
      toast.error("Failed to start service. Please try again.")
    } finally {
      setStartingService(null)
    }
  }

  const handleViewBooking = (booking: Booking) => {
    router.push(`/bookings/${booking.id}`)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Booking Management</h1>
        <Link href="/bookings/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            <p className="text-xs text-muted-foreground">Future appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inProgressBookings.length}</div>
            <p className="text-xs text-muted-foreground">Currently being serviced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search bookings by customer, phone, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>Manage customer appointments and bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading bookings...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 space-y-4 lg:space-y-0"
                >
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{booking.customer_name || 'Unknown Customer'}</h3>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {booking.customer_phone || 'No phone'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Car className="h-4 w-4 mr-2" />
                        {booking.vehicle_plate || 'No plate'} ({booking.vehicle_model || 'Unknown model'})
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {booking.booking_time}
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Service: </span>
                      {booking.service_type_name}
                    </div>

                    {booking.notes && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Notes: </span>
                        {booking.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewBooking(booking)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditBooking(booking)}
                      title="Edit Booking"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                                         {booking.status === "confirmed" && (
                       <Button 
                         size="sm"
                         onClick={() => handleStartService(booking)}
                         title="Start Service"
                         disabled={startingService === booking.id}
                       >
                         {startingService === booking.id ? (
                           <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                         ) : (
                           <Play className="h-4 w-4 mr-1" />
                         )}
                         {startingService === booking.id ? "Starting..." : "Start Service"}
                       </Button>
                     )}
                     {booking.status === "in_progress" && (
                       <Button 
                         size="sm"
                         variant="secondary"
                         onClick={() => router.push(`/services/new?booking_id=${booking.id}`)}
                         title="Create Service"
                       >
                         Create Service
                       </Button>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bookings found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
