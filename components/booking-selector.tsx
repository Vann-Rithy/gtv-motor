"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, Clock, User, Car, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Booking {
  id: number
  phone: string
  customer_name: string
  customer_phone: string
  customer_email: string
  customer_address: string
  vehicle_plate: string
  vehicle_model: string
  vehicle_vin: string
  vehicle_year: number
  service_type_name: string
  booking_date: string
  booking_time: string
  status: string
  notes?: string
  created_at: string
}

interface BookingSelectorProps {
  onBookingSelect: (booking: Booking) => void
  onClose: () => void
}

export default function BookingSelector({ onBookingSelect, onClose }: BookingSelectorProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("confirmed")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Load bookings
  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getBookings({ 
        status: statusFilter,
        limit: 50 
      })
      const bookingsData = response?.data || []
      setBookings(bookingsData)
      setFilteredBookings(bookingsData)
    } catch (error) {
      console.error("Failed to load bookings:", error)
      toast.error("Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [statusFilter])

  // Filter bookings based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = bookings.filter(booking =>
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_phone.includes(searchTerm) ||
        booking.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredBookings(filtered)
    } else {
      setFilteredBookings(bookings)
    }
  }, [searchTerm, bookings])

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking)
  }

  const handleConfirmSelection = () => {
    if (selectedBooking) {
      onBookingSelect(selectedBooking)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="bg-gray-800 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6" />
                <div>
                  <CardTitle className="text-2xl font-bold">Select Existing Booking</CardTitle>
                  <CardDescription className="text-blue-100">
                    Choose a booking to start the service
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Bookings</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by customer name, phone, or plate number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="status">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bookings List */}
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading bookings...</span>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No bookings found matching your criteria
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedBooking?.id === booking.id
                            ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleBookingSelect(booking)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{booking.customer_name}</span>
                                <span className="text-sm text-gray-500">({booking.customer_phone})</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Car className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{booking.vehicle_model} - {booking.vehicle_plate}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{booking.booking_date}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{booking.booking_time}</span>
                              </div>
                              <span className="text-sm font-medium">{booking.service_type_name}</span>
                            </div>
                            {booking.notes && (
                              <p className="text-sm text-gray-600 mt-1">{booking.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Booking Info */}
              {selectedBooking && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Selected Booking</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <strong>{selectedBooking.customer_name}</strong> - {selectedBooking.vehicle_model} ({selectedBooking.vehicle_plate})
                    <br />
                    Service: {selectedBooking.service_type_name} | Date: {selectedBooking.booking_date} at {selectedBooking.booking_time}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={!selectedBooking}
                  className={`${
                    selectedBooking 
                      ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                      : 'bg-gray-400 cursor-not-allowed'
                  } transition-all duration-200`}
                >
                  {selectedBooking ? 'Start Service' : 'Select a booking first'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
