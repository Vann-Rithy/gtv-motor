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
  volume_l?: number
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
  vehicle_model_name: string
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
        const response = await apiClient.getService(serviceId)
        console.log('[Service Details] API Response:', response)
        // Extract service data from the response
        const serviceData = response.data || response
        console.log('[Service Details] Service Data:', serviceData)
        setService(serviceData as ServiceDetail)
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "Service not found"}</p>
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

  const statusTone = service.service_status === "completed" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" :
                    service.service_status === "in_progress" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200" :
                    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"

  const paymentTone = service.payment_status === "paid" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" :
                     service.payment_status === "cancelled" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" :
                     "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{service.invoice_number}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Service Details</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href={`/services/${serviceId}/invoice`}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Status</label>
                    <div className="mt-1">
                      <Badge className={statusTone}>
                        {STATUS_LABELS[service.service_status] || service.service_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Status</label>
                    <div className="mt-1">
                      <Badge className={paymentTone}>
                        {PAYMENT_LABELS[service.payment_status] || service.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Invoice Number</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">{service.invoice_number}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Date</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {service.service_date ? new Date(service.service_date).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">{service.payment_method || "—"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-semibold">{toMoney(service.total_amount)}</div>
                  </div>
                  {service.exchange_rate && service.exchange_rate > 0 && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Exchange Rate</label>
                        <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-semibold text-green-600">
                          {service.exchange_rate.toLocaleString()} KHR per USD
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount (KHR)</label>
                        <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-semibold text-blue-600">
                          {(service.total_khr || (service.total_amount * service.exchange_rate)).toLocaleString()} KHR
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Kilometers</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.current_km?.toLocaleString() || "—"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Volume (L)</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.volume_l ? `${service.volume_l}L` : "—"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Service KM</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.next_service_km?.toLocaleString() || "—"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Service Date</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {service.next_service_date ? new Date(service.next_service_date).toLocaleDateString() : "—"}
                    </div>
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
                                                 <div className="text-sm text-gray-500 dark:text-gray-400">
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
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.customer_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.customer_phone}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.customer_address || "—"}</div>
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
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plate Number</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.vehicle_plate}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.vehicle_model_name || "—"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Year</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.vehicle_year || "—"}</div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Type</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.service_type_name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.service_category}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Type</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">{service.customer_type || "—"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Cost</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{toMoney(service.service_cost)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Technician</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.technician_name || "—"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sales Rep</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.sales_rep_name || "—"}</div>
                  </div>
                </div>
                {service.service_detail && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Details</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {service.service_detail}
                    </div>
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
