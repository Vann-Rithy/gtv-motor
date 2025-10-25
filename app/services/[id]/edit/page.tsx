"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2, User, Car, Calendar, DollarSign, Plus, Trash2, Package } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Service {
  id: number
  invoice_number: string
  customer_id: number
  vehicle_id: number
  service_type_id: number
  service_date: string
  current_km?: number
  volume_l?: number
  next_service_km?: number
  next_service_date?: string
  total_amount: number
  service_cost: number
  payment_method: string
  payment_status: string
  service_status: string
  notes?: string
  technician_id?: number
  sales_rep_id?: number
  customer_name: string
  customer_phone: string
  vehicle_plate: string
  vehicle_model: string
  service_type_name: string
  technician_name?: string
  sales_rep_name?: string
  service_items?: ServiceItem[]
}

interface ServiceItem {
  id?: number
  description: string
  quantity: number
  unit_price: number
  total_price: number
  item_type: 'service' | 'part' | 'labor'
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

export default function EditServicePage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_id: "",
    vehicle_id: "",
    service_type_id: "",
    service_date: "",
    current_km: "",
    volume_l: "",
    next_service_km: "",
    next_service_date: "",
    total_amount: "",
    service_cost: "",
    payment_method: "cash",
    payment_status: "pending",
    service_status: "pending",
    notes: "",
    technician_id: "",
    sales_rep_id: ""
  })

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])

  const serviceId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch service details
        const serviceResponse = await apiClient.getService(serviceId)
        setService(serviceResponse.data)

        // Set form data
        const serviceData = serviceResponse.data
        setFormData({
          customer_id: serviceData.customer_id?.toString() || "",
          vehicle_id: serviceData.vehicle_id?.toString() || "",
          service_type_id: serviceData.service_type_id?.toString() || "",
          service_date: serviceData.service_date ? new Date(serviceData.service_date).toISOString().split('T')[0] : "",
          current_km: serviceData.current_km?.toString() || "",
          volume_l: serviceData.volume_l?.toString() || "",
          next_service_km: serviceData.next_service_km?.toString() || "",
          next_service_date: serviceData.next_service_date ? new Date(serviceData.next_service_date).toISOString().split('T')[0] : "",
          total_amount: serviceData.total_amount?.toString() || "",
          service_cost: serviceData.service_cost?.toString() || "",
          payment_method: serviceData.payment_method || "cash",
          payment_status: serviceData.payment_status || "pending",
          service_status: serviceData.service_status || "pending",
          notes: serviceData.notes || "",
          technician_id: serviceData.technician_id?.toString() || "",
          sales_rep_id: serviceData.sales_rep_id?.toString() || ""
        })

        // Set service items
        if (serviceData.service_items) {
          setServiceItems(serviceData.service_items)
        }

        // Fetch customers, vehicles, and service types
        const [customersRes, vehiclesRes, serviceTypesRes] = await Promise.all([
          apiClient.getCustomers({ limit: 100 }),
          apiClient.getVehicles({ limit: 100 }),
          apiClient.getServiceTypes()
        ])

        setCustomers(customersRes.data || [])
        setVehicles(vehiclesRes.data || [])
        setServiceTypes(serviceTypesRes.data || [])

        setError(null)
      } catch (err: any) {
        console.error("Failed to fetch service data:", err)
        setError(err?.message || "Failed to fetch service data")
      } finally {
        setLoading(false)
      }
    }

    if (serviceId) {
      fetchData()
    }
  }, [serviceId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addServiceItem = () => {
    setServiceItems(prev => [...prev, {
      description: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      item_type: 'part'
    }])
  }

  const removeServiceItem = (index: number) => {
    setServiceItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateServiceItem = (index: number, field: keyof ServiceItem, value: any) => {
    setServiceItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unit_price') {
          updated.total_price = updated.quantity * updated.unit_price
        }
        return updated
      }
      return item
    }))
  }

  const calculateTotal = () => {
    const itemsTotal = serviceItems.reduce((sum, item) => sum + item.total_price, 0)
    return itemsTotal
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customer_id || !formData.vehicle_id || !formData.service_type_id || !formData.service_date) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setSaving(true)

      const totalAmount = calculateTotal()

      const updateData = {
        customer_id: parseInt(formData.customer_id),
        vehicle_id: parseInt(formData.vehicle_id),
        service_type_id: parseInt(formData.service_type_id),
        service_date: formData.service_date,
        current_km: formData.current_km ? parseInt(formData.current_km) : null,
        volume_l: formData.volume_l ? parseFloat(formData.volume_l) : null,
        next_service_km: formData.next_service_km ? parseInt(formData.next_service_km) : null,
        next_service_date: formData.next_service_date || null,
        total_amount: totalAmount,
        service_cost: formData.service_cost ? parseFloat(formData.service_cost) : totalAmount,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        service_status: formData.service_status,
        notes: formData.notes,
        technician_id: formData.technician_id ? parseInt(formData.technician_id) : null,
        sales_rep_id: formData.sales_rep_id ? parseInt(formData.sales_rep_id) : null,
        service_items: serviceItems.filter(item => item.description.trim() !== "")
      }

      await apiClient.updateService(serviceId, updateData)
      toast.success("Service updated successfully")
      router.push(`/services/${serviceId}`)
    } catch (err: any) {
      console.error("Failed to update service:", err)
      toast.error(err?.message || "Failed to update service")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading service data...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href={`/services/${serviceId}`} className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Service</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{service.invoice_number}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Service Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer */}
                <div>
                  <Label htmlFor="customer_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer *
                  </Label>
                  <Select value={formData.customer_id} onValueChange={(value) => handleSelectChange('customer_id', value)}>
                    <SelectTrigger className="mt-1">
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

                {/* Vehicle */}
                <div>
                  <Label htmlFor="vehicle_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vehicle *
                  </Label>
                  <Select value={formData.vehicle_id} onValueChange={(value) => handleSelectChange('vehicle_id', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.plate_number} ({vehicle.model})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Type */}
                <div>
                  <Label htmlFor="service_type_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Service Type *
                  </Label>
                  <Select value={formData.service_type_id} onValueChange={(value) => handleSelectChange('service_type_id', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.service_type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Date */}
                <div>
                  <Label htmlFor="service_date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Service Date *
                  </Label>
                  <Input
                    id="service_date"
                    name="service_date"
                    type="date"
                    required
                    value={formData.service_date}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                {/* Current KM */}
                <div>
                  <Label htmlFor="current_km" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current KM
                  </Label>
                  <Input
                    id="current_km"
                    name="current_km"
                    type="number"
                    value={formData.current_km}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter current mileage"
                  />
                </div>

                {/* Volume (L) */}
                <div>
                  <Label htmlFor="volume_l" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Volume (L)
                  </Label>
                  <Input
                    id="volume_l"
                    name="volume_l"
                    type="number"
                    step="0.1"
                    value={formData.volume_l}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter engine volume in liters"
                  />
                </div>

                {/* Next Service KM */}
                <div>
                  <Label htmlFor="next_service_km" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Next Service KM
                  </Label>
                  <Input
                    id="next_service_km"
                    name="next_service_km"
                    type="number"
                    value={formData.next_service_km}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter next service mileage"
                  />
                </div>

                {/* Next Service Date */}
                <div>
                  <Label htmlFor="next_service_date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Next Service Date
                  </Label>
                  <Input
                    id="next_service_date"
                    name="next_service_date"
                    type="date"
                    value={formData.next_service_date}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                {/* Service Cost */}
                <div>
                  <Label htmlFor="service_cost" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Service Cost
                  </Label>
                  <Input
                    id="service_cost"
                    name="service_cost"
                    type="number"
                    step="0.01"
                    value={formData.service_cost}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter service cost"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-1"
                  rows={3}
                  placeholder="Enter service notes"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status and Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Status & Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Payment Method */}
                <div>
                  <Label htmlFor="payment_method" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Method
                  </Label>
                  <Select value={formData.payment_method} onValueChange={(value) => handleSelectChange('payment_method', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Status */}
                <div>
                  <Label htmlFor="payment_status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Status
                  </Label>
                  <Select value={formData.payment_status} onValueChange={(value) => handleSelectChange('payment_status', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Status */}
                <div>
                  <Label htmlFor="service_status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Service Status
                  </Label>
                  <Select value={formData.service_status} onValueChange={(value) => handleSelectChange('service_status', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select service status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Service Items
                </div>
                <Button type="button" onClick={addServiceItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</Label>
                      <Select value={item.item_type} onValueChange={(value) => updateServiceItem(index, 'item_type', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="part">Part</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="labor">Labor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateServiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateServiceItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex-1">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</Label>
                        <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm font-medium">
                          ${item.total_price.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeServiceItem(index)}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {serviceItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No service items added yet. Click "Add Item" to get started.
                  </div>
                )}

                {/* Total */}
                {serviceItems.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-end">
                      <div className="text-lg font-semibold">
                        Total: ${calculateTotal().toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link href={`/services/${serviceId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
