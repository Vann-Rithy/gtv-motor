"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Loader2, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Customer {
  id: number
  name: string
  phone: string
  email: string
  address: string
}

interface Vehicle {
  id: number
  plate_number: string
  model: string
  customer_id: number
}

interface ServiceType {
  id: number
  name: string
  estimated_duration: number
}

interface BookingFormProps {
  onBookingSelect: (bookingData: any) => void
  onClose: () => void
}

export default function BookingForm({ onBookingSelect, onClose }: BookingFormProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])

  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    phone: "",
    plateNumber: "",
    model: "",
    vehicle_id: "",
    service_type_id: "",
    booking_date: "",
    booking_time: "",
    notes: "",
  })

  const [useExistingCustomer, setUseExistingCustomer] = useState(true)

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
  ]

  const vehicleModels = ["SOBEN", "KAIN", "KOUPREY", "KRUSAR", "KESSOR"]

  // Load form data
  const loadFormData = async () => {
    try {
      setLoading(true)
      const [customersRes, vehiclesRes, serviceTypesRes] = await Promise.all([
        apiClient.getCustomers(),
        apiClient.getVehicles(),
        apiClient.getServiceTypes()
      ])

      setCustomers(customersRes.data || [])
      setVehicles(vehiclesRes.data || [])
      setServiceTypes(serviceTypesRes.data || [])
      setFilteredCustomers(customersRes.data || [])
    } catch (error) {
      console.error("Failed to load form data:", error)
      toast.error("Failed to load form data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFormData()
  }, [])

  // Filter customers based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchTerm, customers])

  // Filter vehicles when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      const filtered = vehicles.filter(v => v.customer_id === selectedCustomer.id)
      setCustomerVehicles(filtered)
    } else {
      setCustomerVehicles([])
    }
  }, [selectedCustomer, vehicles])

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id.toString() === customerId)
    setSelectedCustomer(customer || null)
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      vehicle_id: "" // Reset vehicle when customer changes
    }))
  }

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id.toString(),
      vehicle_id: "" // Reset vehicle when customer changes
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields based on customer type
    if (useExistingCustomer) {
      if (!formData.customer_id || !formData.vehicle_id || !formData.service_type_id || 
          !formData.booking_date || !formData.booking_time) {
        toast.error("Please fill in all required fields")
        return
      }
    } else {
      if (!formData.customer_name || !formData.phone || !formData.plateNumber || 
          !formData.model || !formData.service_type_id || !formData.booking_date || 
          !formData.booking_time) {
        toast.error("Please fill in all required fields")
        return
      }
    }

    try {
      setSaving(true)
      
      let bookingData: any = {
        service_type_id: Number(formData.service_type_id),
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        notes: formData.notes || null
      }

      if (useExistingCustomer) {
        // For existing customers, send customer_id and vehicle_id
        bookingData.customer_id = Number(formData.customer_id)
        bookingData.vehicle_id = Number(formData.vehicle_id)
        // Include phone field for existing customers
        bookingData.phone = selectedCustomer?.phone || ""
        // Also include customer_data and vehicle_data for API compatibility
        bookingData.customer_data = {
          name: selectedCustomer?.name || "",
          phone: selectedCustomer?.phone || "",
          email: selectedCustomer?.email || "",
          address: selectedCustomer?.address || ""
        }
        const selectedVehicle = customerVehicles.find(v => v.id.toString() === formData.vehicle_id)
        bookingData.vehicle_data = {
          plate_number: selectedVehicle?.plate_number || "",
          model: selectedVehicle?.model || "",
          vin_number: "",
          year: new Date().getFullYear()
        }
      } else {
        // For new customers, send customer_data and vehicle_data
        bookingData.phone = formData.phone
        bookingData.customer_data = {
          name: formData.customer_name,
          phone: formData.phone,
          email: "",
          address: ""
        }
        bookingData.vehicle_data = {
          plate_number: formData.plateNumber,
          model: formData.model,
          vin_number: "",
          year: new Date().getFullYear()
        }
      }

      const response = await apiClient.createBooking(bookingData)
      
      // Get the created booking data to pass back
      const createdBooking = response.data
      
      // Prepare booking data for service form
      const serviceFormData = {
        customer_name: useExistingCustomer ? selectedCustomer?.name : formData.customer_name,
        customer_phone: useExistingCustomer ? selectedCustomer?.phone : formData.phone,
        customer_email: useExistingCustomer ? selectedCustomer?.email : "",
        customer_address: useExistingCustomer ? selectedCustomer?.address : "",
        vehicle_plate: useExistingCustomer ? 
          customerVehicles.find(v => v.id.toString() === formData.vehicle_id)?.plate_number : 
          formData.plateNumber,
        vehicle_model: useExistingCustomer ? 
          customerVehicles.find(v => v.id.toString() === formData.vehicle_id)?.model : 
          formData.model,
        service_type_name: serviceTypes.find(s => s.id.toString() === formData.service_type_id)?.name,
        notes: formData.notes,
        booking_id: createdBooking.id
      }
      
      toast.success("Booking created successfully!")
      onBookingSelect(serviceFormData)
    } catch (error) {
      console.error("Failed to create booking:", error)
      toast.error("Failed to create booking")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading form data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Booking</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Search */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Search for existing customer or select from list</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Type Selection */}
                <div className="flex space-x-4 mb-4">
                  <Button
                    type="button"
                    variant={useExistingCustomer ? "default" : "outline"}
                    onClick={() => setUseExistingCustomer(true)}
                  >
                    Existing Customer
                  </Button>
                  <Button
                    type="button"
                    variant={!useExistingCustomer ? "default" : "outline"}
                    onClick={() => setUseExistingCustomer(false)}
                  >
                    New Customer
                  </Button>
                </div>

                {useExistingCustomer ? (
                  <>
                    <div className="flex space-x-2 mb-4">
                      <Input 
                        placeholder="Search by customer name or phone number..." 
                        className="flex-1"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={() => setSearchTerm("")}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="customer">Customer *</Label>
                        <Select
                          value={formData.customer_id}
                          onValueChange={(value) => {
                            const customer = customers.find(c => c.id.toString() === value)
                            if (customer) {
                              handleCustomerSelect(customer)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredCustomers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.name} ({customer.phone})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">Customer Phone</Label>
                        <Input
                          id="customerPhone"
                          defaultValue={selectedCustomer?.phone || ""}
                          placeholder="Customer phone number"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle">Vehicle *</Label>
                        <Select
                          value={formData.vehicle_id}
                          onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                          disabled={!selectedCustomer}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={selectedCustomer ? "Select vehicle" : "Select customer first"} />
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
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Customer Name *</Label>
                        <Input
                          id="customerName"
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          placeholder="Enter customer name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="plateNumber">Vehicle Plate Number *</Label>
                        <Input
                          id="plateNumber"
                          value={formData.plateNumber}
                          onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                          placeholder="e.g., SOBEN 2CD-7960"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="model">Vehicle Model *</Label>
                        <Select
                          value={formData.model}
                          onValueChange={(value) => setFormData({ ...formData, model: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle model" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleModels.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>Select service type and appointment time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            {service.name}
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
                      min={new Date().toISOString().split("T")[0]}
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Booking & Continue to Service
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
