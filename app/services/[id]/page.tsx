"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, DollarSign, Calendar, User, Car, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface ServiceDetail {
  id: number
  invoice_number: string
  service_date: string
  current_km: number
  next_service_km: number
  next_service_date: string
  total_amount: number
  payment_method: string
  service_status: string
  payment_status: string
  notes: string
  customer_name: string
  customer_phone: string
  customer_address: string
  vehicle_plate: string
  vehicle_model: string
  vehicle_year: number
  service_type_name: string
  service_category: string
  technician_name: string
  sales_rep_name: string
  service_items: Array<{
    id: number
    description: string
    quantity: number
    unit_price: number
    total_price: number
    item_type: string
  }>
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
}

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  cancelled: "Cancelled",
}

function toMoney(n: number | string | null | undefined) {
  const num = Number(n || 0)
  return num.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const serviceId = params.id as string

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getService(serviceId)
        setService(data as ServiceDetail)
        setError(null)
      } catch (err: any) {
        console.error("Failed to fetch service:", err)
        setError(err?.message || "Failed to fetch service details")
      } finally {
        setLoading(false)
      }
    }

    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading service details...</p>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error || "Service not found"}</p>
            <Link href="/services">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Services
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const statusTone = service.service_status === "completed" ? "bg-green-100 text-green-800" : 
                    service.service_status === "in_progress" ? "bg-blue-100 text-blue-800" : 
                    "bg-yellow-100 text-yellow-800"

  const paymentTone = service.payment_status === "paid" ? "bg-green-100 text-green-800" : 
                     service.payment_status === "cancelled" ? "bg-red-100 text-red-800" : 
                     "bg-yellow-100 text-yellow-800"

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/services" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{service.invoice_number}</h1>
                <p className="text-sm text-gray-500">Service Details</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href={`/services/${service.id}/invoice`}>
                <Button>
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Invoice
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
            {/* Service Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Service Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service Status</label>
                    <div className="mt-1">
                      <Badge className={statusTone}>
                        {STATUS_LABELS[service.service_status] || service.service_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Status</label>
                    <div className="mt-1">
                      <Badge className={paymentTone}>
                        {PAYMENT_LABELS[service.payment_status] || service.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service Date</label>
                    <div className="mt-1 text-sm">
                      {service.service_date ? new Date(service.service_date).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Method</label>
                    <div className="mt-1 text-sm">{service.payment_method || "—"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Kilometers</label>
                    <div className="mt-1 text-sm">{service.current_km?.toLocaleString() || "—"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Next Service KM</label>
                    <div className="mt-1 text-sm">{service.next_service_km?.toLocaleString() || "—"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Items */}
            <Card>
              <CardHeader>
                <CardTitle>Service Items</CardTitle>
                <CardDescription>Detailed breakdown of services and parts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.service_items?.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.description}</div>
                                                 <div className="text-sm text-gray-500">
                           {item.quantity} × {toMoney(Number(item.unit_price) || 0)} ({item.item_type})
                         </div>
                      </div>
                                             <div className="text-right">
                         <div className="font-medium">{toMoney(Number(item.total_price) || 0)}</div>
                       </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-4 border-t">
                                         <div className="text-right">
                       <div className="text-lg font-bold">Total: {toMoney(Number(service.total_amount) || 0)}</div>
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {service.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{service.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <div className="mt-1 text-sm">{service.customer_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <div className="mt-1 text-sm">{service.customer_phone}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <div className="mt-1 text-sm">{service.customer_address || "—"}</div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Plate Number</label>
                  <div className="mt-1 text-sm">{service.vehicle_plate}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Model</label>
                  <div className="mt-1 text-sm">{service.vehicle_model}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Year</label>
                  <div className="mt-1 text-sm">{service.vehicle_year || "—"}</div>
                </div>
              </CardContent>
            </Card>

            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Service Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service Type</label>
                  <div className="mt-1 text-sm">{service.service_type_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <div className="mt-1 text-sm">{service.service_category}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Technician</label>
                  <div className="mt-1 text-sm">{service.technician_name || "—"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sales Rep</label>
                  <div className="mt-1 text-sm">{service.sales_rep_name || "—"}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
