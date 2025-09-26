"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Phone, Mail, MapPin, Car, Calendar, Edit, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Customer {
  id: string
  name: string
  phone: string
  address: string
  email: string
  created_at: string
  updated_at: string
}

interface Vehicle {
  id: number
  plate_number: string
  model: string
  year: number
  vin_number: string
  color: string
  created_at: string
}

interface Service {
  id: number
  invoice_number: string
  service_date: string
  total_amount: number
  service_status: string
  payment_status: string
  service_type_name: string
  vehicle_plate: string
  vehicle_model: string
}

interface Booking {
  id: number
  booking_date: string
  booking_time: string
  status: string
  service_type_name: string
  vehicle_plate: string
  vehicle_model: string
  notes: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const customerId = params.id as string

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true)

        // Fetch customer details
        const customerResponse = await apiClient.getCustomer(customerId)
        setCustomer(customerResponse.data)

        // Fetch customer's vehicles
        const vehiclesResponse = await apiClient.getVehicles({ customer_id: customerId })
        setVehicles(vehiclesResponse.data || [])

        // Fetch customer's services
        const servicesResponse = await apiClient.getServices({ customer_id: customerId })
        setServices(servicesResponse.data || [])

        // Fetch customer's bookings
        const bookingsResponse = await apiClient.getBookings({ customer_id: customerId })
        setBookings(bookingsResponse.data || [])

        setError(null)
      } catch (err: any) {
        console.error("Failed to fetch customer data:", err)
        setError(err?.message || "Failed to fetch customer data")
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchCustomerData()
    }
  }, [customerId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading customer details...</p>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "Customer not found"}</p>
            <Link href="/customers">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      confirmed: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
      in_progress: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
      completed: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
      cancelled: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
      no_show: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.no_show}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/customers" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customer.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer Details</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href={`/customers/${customerId}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer ID</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.id}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {customer.phone}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {customer.email || "—"}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {customer.address || "—"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Vehicles ({vehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No vehicles found for this customer.</p>
                ) : (
                  <div className="space-y-3">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{vehicle.plate_number}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {vehicle.model} ({vehicle.year}) - {vehicle.color}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          VIN: {vehicle.vin_number}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Recent Services ({services.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No services found for this customer.</p>
                ) : (
                  <div className="space-y-3">
                    {services.slice(0, 5).map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{service.invoice_number}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {service.service_type_name} - {service.vehicle_plate}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            ${(Number(service.total_amount) || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(service.service_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Vehicles</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{vehicles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Services</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{services.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{bookings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No bookings found.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {booking.service_type_name}
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {booking.vehicle_plate} - {new Date(booking.booking_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
