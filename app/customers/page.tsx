"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Plus, Phone, Car, Calendar, Eye, Loader2, Edit, Trash2, MessageSquare, PhoneCall, Save, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { formatKM, formatCurrency } from "@/lib/utils"

interface Customer {
  id: string
  name: string
  phone: string
  address: string
  email: string
  created_at: string
  updated_at: string
  vehicle_count: number
  service_count: number
  alert_count: number
  booking_count: number
  last_service_date?: string
  first_service_date?: string
  total_spent: number
  latest_vehicle_plate?: string
  latest_vehicle_model?: string
  latest_vehicle_model_name?: string
  latest_vehicle_category?: string
  latest_warranty_end?: string
  pending_services: number
  in_progress_services: number
  completed_services: number
  pending_alerts: number
  vehicles?: Vehicle[]
  recent_services?: ServiceRecord[]
  active_alerts?: Alert[]
  upcoming_bookings?: Booking[]
}

interface Vehicle {
  id: number
  plate_number: string
  model: string
  vin_number: string
  year: number
  warranty_status: "active" | "expired" | "unknown"
  warranty_days_remaining: number
  warranty_end_date: string
  service_count: number
  last_service_date?: string
  current_km?: number
}

interface ServiceRecord {
  id: number
  invoice_number: string
  service_date: string
  service_type_name: string
  service_category: string
  total_amount: number
  service_status: string
  payment_status: string
  plate_number: string
  vehicle_model: string
  vehicle_model_name?: string
  vehicle_model_category?: string
  vehicle_cc?: string
  vehicle_engine_type?: string
  technician_name?: string
}

interface Alert {
  id: number
  alert_type: string
  alert_date: string
  message: string
  plate_number: string
  vehicle_model: string
}

interface Booking {
  id: number
  booking_date: string
  booking_time: string
  status: string
  plate_number: string
  vehicle_model: string
  vehicle_model_name?: string
  vehicle_model_category?: string
  service_type_name: string
}

export default function Customers() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewIdFromURL = searchParams.get("view")
  const { t } = useLanguage()

  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const customersPerPage = 10

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [paginationLoading, setPaginationLoading] = useState(false)

  const fetchCustomers = async (search?: string, page: number = 1) => {
    try {
      if (search) setSearchLoading(true)
      else if (page !== currentPage) setPaginationLoading(true)
      else setLoading(true)

      const response = await apiClient.getCustomers({
        search: search || undefined,
        limit: customersPerPage,
        page: page,
      })

      if (response.data) {
        console.log("Raw API response:", response.data.length, "customers")
        const transformed = response.data
          .filter((customer: any) => {
            // Filter out customers with invalid IDs
            const id = customer.id
            const isValid = id !== null && id !== undefined && id !== 0 && id !== "0" && id !== ""
            if (!isValid) {
              console.log("Filtered out customer with invalid ID:", customer.name, "ID:", id)
            }
            return isValid
          })
          .map((customer: any) => ({
            ...customer,
            id: customer.id.toString(),
            total_spent: Number(customer.total_spent) || 0,
            vehicle_count: Number(customer.vehicle_count) || 0,
            service_count: Number(customer.service_count) || 0,
            alert_count: Number(customer.alert_count) || 0,
            booking_count: Number(customer.booking_count) || 0,
            pending_services: Number(customer.pending_services) || 0,
            in_progress_services: Number(customer.in_progress_services) || 0,
            completed_services: Number(customer.completed_services) || 0,
            pending_alerts: Number(customer.pending_alerts) || 0,
          }))

        console.log("After filtering:", transformed.length, "valid customers")

        // Ensure we only display exactly 10 customers per page
        const limitedCustomers = transformed.slice(0, customersPerPage)
        setCustomers(limitedCustomers)
        setError(null)

        // Update pagination info
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1)
          setTotalCustomers(response.pagination.total || transformed.length)
        } else {
          // Fallback if no pagination info
          setTotalPages(1)
          setTotalCustomers(transformed.length)
        }
      }
    } catch (err) {
      console.error("[v0] Error fetching customers:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch customers")
    } finally {
      setLoading(false)
      setSearchLoading(false)
      setPaginationLoading(false)
    }
  }

  const fetchCustomerDetails = async (customerId: string) => {
    // Validate customer ID before fetching
    if (!customerId || customerId === "0" || customerId === "null" || customerId === "undefined") {
      setError("Invalid customer ID")
      return
    }

    setDetailsLoading(true)
    try {
      // Fetch customer details
      const customerResponse = await apiClient.getCustomer(customerId)
      if (!customerResponse.success || !customerResponse.data) {
        throw new Error(customerResponse.message || "Customer not found")
      }

      // Fetch customer's vehicles
      const vehiclesResponse = await apiClient.getVehicles({ customer_id: customerId })
      const vehicles = vehiclesResponse.success ? (vehiclesResponse.data || []) : []

      // Fetch customer's services
      const servicesResponse = await apiClient.getServices({ customer_id: customerId })
      const services = servicesResponse.success ? (servicesResponse.data || []) : []

      // Combine all data
      const customerData = {
        ...customerResponse.data,
        id: customerResponse.data.id.toString(),
        vehicles: vehicles,
        recent_services: services.slice(0, 10) // Limit to recent 10 services
      }

      setSelectedCustomer(customerData)
      setError(null)
    } catch (e) {
      console.error("[v0] details error:", e)
      setError(e instanceof Error ? e.message : "Failed to fetch customer details")
    } finally {
      setDetailsLoading(false)
    }
  }


  // Initial & search
  useEffect(() => {
    fetchCustomers("", currentPage)
  }, [currentPage])

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
      if (searchTerm.trim()) fetchCustomers(searchTerm, 1)
      else fetchCustomers("", 1)
    }, 500)
    return () => clearTimeout(t)
  }, [searchTerm])

  // Deep-link open: /customers?view=<id>
  useEffect(() => {
    if (!viewIdFromURL) return
    ;(async () => {
      await fetchCustomerDetails(viewIdFromURL)
      setIsDetailsOpen(true)
    })()
  }, [viewIdFromURL])

  // Close dialog → clean the URL (?view=)
  const closeDetails = () => {
    setIsDetailsOpen(false)
    setIsEditing(false)
    setEditForm({ name: "", phone: "", email: "", address: "" })
    const url = new URL(window.location.href)
    url.searchParams.delete("view")
    router.replace(url.pathname + (url.search ? `?${url.searchParams.toString()}` : ""), { scroll: false })
  }

  const startEditing = () => {
    if (selectedCustomer) {
      setEditForm({
        name: selectedCustomer.name || "",
        phone: selectedCustomer.phone || "",
        email: selectedCustomer.email || "",
        address: selectedCustomer.address || ""
      })
      setIsEditing(true)
    }
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm({ name: "", phone: "", email: "", address: "" })
  }

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update customer")
      }

      const result = await response.json()

      // Update the selected customer with new data
      setSelectedCustomer({ ...selectedCustomer, ...editForm })

      // Update the customers list
      setCustomers(prev =>
        prev.map(customer =>
          customer.id === selectedCustomer.id
            ? { ...customer, ...editForm }
            : customer
        )
      )

      setIsEditing(false)
      setEditForm({ name: "", phone: "", email: "", address: "" })
    } catch (error) {
      console.error("Error updating customer:", error)
      // You could add a toast notification here
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredCustomers = useMemo(() => customers, [customers])

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const getWarrantyStatus = (customer: Customer) => {
    if (!customer.latest_warranty_end) {
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Warranty Expired</Badge>
    }
    const warrantyEnd = new Date(customer.latest_warranty_end)
    const today = new Date()
    const daysRemaining = Math.ceil((warrantyEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysRemaining > 0) {
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Active Warranty</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Warranty Expired</Badge>
  }

  const getServiceDueStatus = (customer: Customer) => {
    if (customer.last_service_date) {
      const last = new Date(customer.last_service_date)
      const months = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24 * 30)
      if (months > 6) {
        return (
          <Badge className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Service Due
          </Badge>
        )
      }
    }
    return null
  }

  // Phone number formatting function
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "N/A"
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length === 10) {
      return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
    }
    return phone // Return original if not 10 digits
  }

  const getNextServiceDate = (customer: Customer) => {
    if (customer.last_service_date) {
      const last = new Date(customer.last_service_date)
      const next = new Date(last)
      next.setMonth(next.getMonth() + 6)
      return next.toISOString().split("T")[0]
    }
    return null
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading customers...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <Button onClick={() => fetchCustomers()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('nav.customers', 'Customer Management')}</h1>
        </div>
        <Link href="/customers/new">
          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            {t('customers.add', '+ Add Customer')}
          </Button>
        </Link>
      </div>

      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 animate-spin" />
          )}
          <Input
            placeholder={t('customers.search_placeholder', 'Search customers by name, phone, or plate number...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <Button variant="outline" className="h-12 bg-transparent">
          Filter
        </Button>
      </div>

      {/* Customer Cards */}
      <div className="space-y-4">
        {paginationLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading customers...</span>
            </div>
          </div>
        )}

        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                {/* Customer Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {customer.name}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation()
                          // Validate customer ID before opening details
                          if (!customer.id || customer.id === "0" || customer.id === "null" || customer.id === "undefined") {
                            setError("Invalid customer ID")
                            return
                          }
                          await fetchCustomerDetails(customer.id)
                          setIsDetailsOpen(true)
                          const url = new URL(window.location.href)
                          url.searchParams.set("view", customer.id)
                          router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false })
                        }}
                        className="text-gray-600 dark:text-gray-400"
                        disabled={!customer.id || customer.id === "0" || customer.id === "null" || customer.id === "undefined"}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Link href={`/services/new?customer=${customer.id}`}>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                          onClick={(e) => e.stopPropagation()}
                          disabled={!customer.id || customer.id === "0" || customer.id === "null" || customer.id === "undefined"}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Service
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Contact & Location */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{formatPhoneNumber(customer.phone)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{customer.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Address:</span>
                      <span className="ml-2">{customer.address || "N/A"}</span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getWarrantyStatus(customer)}
                    {getServiceDueStatus(customer)}
                  </div>

                  {/* Vehicle Details */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <Car className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        {customer.latest_vehicle_plate || "No Vehicle"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div>Model: {customer.latest_vehicle_model_name || customer.latest_vehicle_model || "N/A"}</div>
                      {customer.latest_vehicle_category && (
                        <div>Category: {customer.latest_vehicle_category}</div>
                      )}
                      <div>Vehicles: {customer.vehicle_count || 0}</div>
                    </div>
                  </div>

                  {/* Service Summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Total Services:</span> {customer.service_count || 0}
                        <span className="mx-2">•</span>
                        <span className="font-medium">Completed:</span> {customer.completed_services || 0}
                      </div>
                      <div className="text-purple-600 dark:text-purple-400 font-semibold">
                        {formatCurrency(customer.total_spent || 0)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Last Service:</span> {customer.last_service_date
                          ? new Date(customer.last_service_date).toLocaleDateString()
                          : "Never"}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="font-medium">Next Service:</span> {customer.last_service_date
                          ? new Date(new Date(customer.last_service_date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? "No customers found matching your search." : "No customers found. Add your first customer!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {filteredCustomers.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * customersPerPage) + 1} to {Math.min(currentPage * customersPerPage, totalCustomers)} of {totalCustomers} customers
                {filteredCustomers.length < customersPerPage && currentPage === totalPages && (
                  <span className="ml-2 text-blue-600">• Last page</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || paginationLoading}
                >
                  {paginationLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 mr-1" />
                  )}
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || paginationLoading}
                >
                  Next
                  {paginationLoading ? (
                    <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-1" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SINGLE dialog controlled by state — matches the screenshot layout */}
      <Dialog open={isDetailsOpen} onOpenChange={(o) => (o ? setIsDetailsOpen(true) : closeDetails())}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Customer Details</DialogTitle>
                <DialogDescription>
                  {selectedCustomer ? (
                    <>
                      Complete information for{" "}
                      <span className="font-medium text-foreground">{selectedCustomer.name}</span>
                    </>
                  ) : (
                    "Loading…"
                  )}
                </DialogDescription>
              </div>
              {selectedCustomer && (
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={startEditing}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <PhoneCall className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={handleUpdateCustomer}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {isUpdating ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEditing}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          {detailsLoading || !selectedCustomer ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading details...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer Statistics */}
              <section>
                <h3 className="mb-3 text-sm font-semibold tracking-tight">{t('customers.customer_overview', 'Customer Overview')}</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border bg-muted/40 p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">{selectedCustomer.vehicle_count}</div>
                    <div className="text-xs text-muted-foreground">{t('customers.vehicles', 'Vehicles')}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3 text-center">
                    <div className="text-lg font-bold text-green-600">{selectedCustomer.service_count}</div>
                    <div className="text-xs text-muted-foreground">Services</div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3 text-center">
                    <div className="text-lg font-bold text-orange-600">{selectedCustomer.alert_count}</div>
                    <div className="text-xs text-muted-foreground">Alerts</div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3 text-center">
                    <div className="text-lg font-bold text-purple-600">{formatCurrency(selectedCustomer.total_spent)}</div>
                    <div className="text-xs text-muted-foreground">Total Spent</div>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h3 className="mb-2 text-sm font-semibold tracking-tight">{t('customers.contact_info', 'Contact Information')}</h3>
                {!isEditing ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                    <div className="space-y-2">
                      <div className="grid grid-cols-[70px_1fr] gap-2">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{selectedCustomer.name}</span>
                      </div>
                      <div className="grid grid-cols-[70px_1fr] gap-2">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="break-all">{selectedCustomer.email || "-"}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-[70px_1fr] gap-2">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{selectedCustomer.phone || "-"}</span>
                      </div>
                      <div className="grid grid-cols-[70px_1fr] gap-2">
                        <span className="text-muted-foreground">Address:</span>
                        <span>{selectedCustomer.address || "-"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name *</Label>
                        <Input
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Customer name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone *</Label>
                        <Input
                          id="edit-phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Address</Label>
                      <Textarea
                        id="edit-address"
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Customer address"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Vehicles */}
              <section>
                <h3 className="mb-2 text-sm font-semibold tracking-tight">{t('customers.vehicles', 'Vehicles')} ({selectedCustomer.vehicle_count})</h3>
                <div className="space-y-3">
                  {(selectedCustomer.vehicles ?? []).map((vehicle, index) => (
                    <div key={vehicle.id} className="rounded-lg border bg-muted/40 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">{vehicle.plate_number}</div>
                        <div className="flex space-x-2">
                          <Badge
                            variant={vehicle.warranty_status === 'active' ? 'default' : vehicle.warranty_status === 'expired' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {vehicle.warranty_status === 'active' ? `Warranty Active (${vehicle.warranty_days_remaining} days)` :
                             vehicle.warranty_status === 'expired' ? 'Warranty Expired' : 'Warranty Unknown'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                        <div className="space-y-2">
                          <div className="grid grid-cols-[60px_1fr] gap-2">
                            <span className="text-muted-foreground">Model:</span>
                            <span className="font-medium">{vehicle.model}</span>
                          </div>
                          <div className="grid grid-cols-[60px_1fr] gap-2">
                            <span className="text-muted-foreground">VIN:</span>
                            <span className="break-all text-xs">{vehicle.vin_number}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-[60px_1fr] gap-2">
                            <span className="text-muted-foreground">Year:</span>
                            <span>{vehicle.year}</span>
                          </div>
                          <div className="grid grid-cols-[95px_1fr] gap-2">
                            <span className="text-muted-foreground">Current KM:</span>
                            <span>{vehicle.current_km ? vehicle.current_km.toLocaleString() : "-"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Services: {vehicle.service_count} | Last Service: {vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : "Never"}
                      </div>
                    </div>
                  ))}
                  {(!selectedCustomer.vehicles || selectedCustomer.vehicles.length === 0) && (
                    <div className="rounded-lg border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                      No vehicles registered
                    </div>
                  )}
                </div>
              </section>

              {/* Service History */}
              <section>
                <h3 className="mb-2 text-sm font-semibold tracking-tight">{t('customers.recent_services', 'Recent Service History')}</h3>
                <div className="space-y-2">
                  {(selectedCustomer.recent_services ?? []).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border bg-background px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{s.service_type_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(s.service_date).toLocaleDateString()} • {s.plate_number} • {s.vehicle_model_name || s.vehicle_model}
                          {s.vehicle_cc && ` (${s.vehicle_cc}CC)`}
                        </div>
                        {s.technician_name && (
                          <div className="text-xs text-muted-foreground">Technician: {s.technician_name}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 pl-4">
                        <div className="text-sm font-semibold tabular-nums">
                          {formatCurrency(Number(s.total_amount || 0))}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={
                              s.service_status === "completed"
                                ? "default"
                                : s.service_status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="capitalize text-xs"
                          >
                            {(s.service_status || "pending").replace("_", " ")}
                          </Badge>
                          <Badge
                            variant={s.payment_status === "paid" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {s.payment_status || "pending"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!selectedCustomer.recent_services || selectedCustomer.recent_services.length === 0) && (
                    <div className="rounded-lg border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                      No service history yet
                    </div>
                  )}
                </div>
              </section>

              {/* Active Alerts */}
              {selectedCustomer.active_alerts && selectedCustomer.active_alerts.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold tracking-tight">Active Alerts ({selectedCustomer.active_alerts.length})</h3>
                  <div className="space-y-2">
                    {selectedCustomer.active_alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-orange-800">{alert.alert_type.replace("_", " ").toUpperCase()}</div>
                          <div className="text-sm text-orange-600">{alert.message}</div>
                          <div className="text-xs text-orange-500">
                            {alert.plate_number} • Due: {new Date(alert.alert_date).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Action Required
                        </Badge>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Upcoming Bookings */}
              {selectedCustomer.upcoming_bookings && selectedCustomer.upcoming_bookings.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold tracking-tight">Upcoming Bookings ({selectedCustomer.upcoming_bookings.length})</h3>
                  <div className="space-y-2">
                    {selectedCustomer.upcoming_bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between rounded-lg border bg-background px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{booking.service_type_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {booking.plate_number} • {booking.vehicle_model_name || booking.vehicle_model}
                            {booking.vehicle_model_category && ` (${booking.vehicle_model_category})`}
                          </div>
                        </div>
                        <Badge
                          variant={booking.status === "confirmed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Service Statistics */}
              <section>
                <h3 className="mb-2 text-sm font-semibold tracking-tight">Service Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-muted/40 p-3 text-center">
                    <div className="text-lg font-bold text-green-600">{selectedCustomer.completed_services}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3 text-center">
                    <div className="text-lg font-bold text-yellow-600">{selectedCustomer.in_progress_services}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3 text-center">
                    <div className="text-lg font-bold text-orange-600">{selectedCustomer.pending_services}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              {!isEditing && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold tracking-tight">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href={`/services/new?customer=${selectedCustomer.id}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Service
                      </Button>
                    </Link>
                    <Link href={`/bookings/new?customer=${selectedCustomer.id}`}>
                      <Button variant="outline" className="w-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        New Booking
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={startEditing}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Customer
                    </Button>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

