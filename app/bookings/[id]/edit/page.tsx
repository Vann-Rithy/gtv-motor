"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Booking {
  id: number
  customer_id: number
  vehicle_id: number
  service_type_id: number
  booking_date: string
  booking_time: string
  status: string
  notes: string
  customer_name: string
  customer_phone: string
  vehicle_plate: string
  vehicle_model: string
  service_type_name: string
}

interface Customer {
  id: number
  name: string
  phone: string
}

interface Vehicle {
  id: number
  plate_number: string
  model: string
  customer_id: number
}

interface ServiceType {
  id: number
  service_type_name: string
}

export default function EditBooking() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([])

  // Function to filter vehicles for the selected customer
  const filterVehiclesForCustomer = (customerId: number) => {
    if (customerId && vehicles.length > 0) {
      const filtered = vehicles.filter(v => Number(v.customer_id) === Number(customerId))
      console.log(`Filtering vehicles for customer ${customerId}:`, {
        totalVehicles: vehicles.length,
        filteredVehicles: filtered.length,
        customerId,
        vehicles: vehicles.map(v => ({ id: v.id, customer_id: v.customer_id, plate: v.plate_number }))
      })
      setCustomerVehicles(filtered)
    } else {
      console.log(`No vehicles to filter for customer ${customerId}`, {
        customerId,
        vehiclesLength: vehicles.length
      })
      setCustomerVehicles([])
    }
  }

  const [formData, setFormData] = useState({
    customer_id: "",
    vehicle_id: "",
    service_type_id: "",
    booking_date: "",
    booking_time: "",
    status: "",
    notes: ""
  })

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
  ]

  const statusOptions = [
    { value: "confirmed", label: "Confirmed" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "no_show", label: "No Show" }
  ]

  // Load booking data
  const loadBooking = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getBooking(Number(bookingId))
      const bookingData = response.data
      setBooking(bookingData)

      setFormData({
        customer_id: bookingData.customer_id ? bookingData.customer_id.toString() : "",
        vehicle_id: bookingData.vehicle_id ? bookingData.vehicle_id.toString() : "",
        service_type_id: bookingData.service_type_id.toString(),
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        status: bookingData.status,
        notes: bookingData.notes || ""
      })

      // Set selected customer for vehicle filtering
      if (bookingData.customer_id) {
        const customer = {
          id: bookingData.customer_id,
          name: bookingData.customer_name,
          phone: bookingData.customer_phone
        }
        setSelectedCustomer(customer)
        console.log("Booking loaded, customer set:", customer)
        console.log("Available vehicles:", vehicles.length)
        // Filter vehicles for this customer
        filterVehiclesForCustomer(bookingData.customer_id)
      }
    } catch (error) {
      console.error("Failed to load booking:", error)
      toast.error("Failed to load booking data")
      router.push("/bookings")
    } finally {
      setLoading(false)
    }
  }

  // Load customers, vehicles, and service types
  const loadFormData = async () => {
    try {
      const [customersRes, vehiclesRes, serviceTypesRes] = await Promise.all([
        apiClient.getCustomers({ limit: 100 }), // Load more customers to ensure we get all
        apiClient.getVehicles({ limit: 100 }), // Load more vehicles to ensure we get all
        apiClient.getServiceTypes()
      ])

      setCustomers(customersRes.data || [])
      setVehicles(vehiclesRes.data || [])
      setServiceTypes(serviceTypesRes.data || [])
      console.log("Form data loaded:", {
        customers: customersRes.data?.length || 0,
        vehicles: vehiclesRes.data?.length || 0,
        serviceTypes: serviceTypesRes.data?.length || 0
      })
    } catch (error) {
      console.error("Failed to load form data:", error)
      toast.error("Failed to load form data")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      // First load the form data (customers, vehicles, service types)
      await loadFormData()
      // Then load the booking data (which depends on vehicles being loaded)
      await loadBooking()
    }
    loadData()
  }, [bookingId])

  // Filter vehicles when customer changes or vehicles are loaded
  useEffect(() => {
    if (selectedCustomer && vehicles.length > 0) {
      filterVehiclesForCustomer(selectedCustomer.id)
    } else {
      setCustomerVehicles([])
    }
  }, [selectedCustomer, vehicles])

  // Debug customerVehicles changes
  useEffect(() => {
    console.log("customerVehicles updated:", customerVehicles)
  }, [customerVehicles])

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id.toString() === customerId)
    setSelectedCustomer(customer || null)
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      vehicle_id: "" // Reset vehicle when customer changes
    }))
    // Filter vehicles for the selected customer
    if (customer) {
      filterVehiclesForCustomer(customer.id)
    } else {
      setCustomerVehicles([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    try {
      setSaving(true)

      const updateData = {
        customer_id: Number(formData.customer_id),
        vehicle_id: Number(formData.vehicle_id),
        service_type_id: Number(formData.service_type_id),
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        status: formData.status,
        notes: formData.notes || null
      }

      await apiClient.updateBooking(booking.id, updateData)

      toast.success("Booking updated successfully")
      router.push("/bookings")
    } catch (error) {
      console.error("Failed to update booking:", error)
      toast.error("Failed to update booking")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading booking...</span>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Booking not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Booking</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Select customer and vehicle for this booking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Customer *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={handleCustomerChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} ({customer.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle">Vehicle *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                  disabled={!selectedCustomer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedCustomer
                        ? "Select customer first"
                        : customerVehicles.length === 0
                          ? "No vehicles found for this customer"
                          : "Select vehicle"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {customerVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.plate_number} ({vehicle.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Update service type, date, time, and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select
                  value={formData.service_type_id}
                  onValueChange={(value) => setFormData({ ...formData, service_type_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.service_type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bookingDate">Booking Date *</Label>
                <Input
                  id="bookingDate"
                  type="date"
                  value={formData.booking_date}
                  onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bookingTime">Booking Time *</Label>
                <Select
                  value={formData.booking_time}
                  onValueChange={(value) => setFormData({ ...formData, booking_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Description</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional description for the booking"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Booking
          </Button>
        </div>
      </form>
    </div>
  )
}
