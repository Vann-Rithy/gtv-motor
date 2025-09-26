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
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

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
  service_type_name: string
}

export default function Customers() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewIdFromURL = searchParams.get("view")

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
        const transformed = response.data.map((customer: any) => ({
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
    setDetailsLoading(true)
    try {
      const response = await apiClient.getCustomer(customerId)

      if (response.data) {
        const data = response.data
        setSelectedCustomer({ ...data, id: data.id.toString() })
      } else {
        throw new Error("API returned no customer data")
      }
    } catch (e) {
      console.error("[v0] details error:", e)
      setError("Failed to fetch customer details")
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
    if (!customer.latest_warranty_end) return null
    const warrantyEnd = new Date(customer.latest_warranty_end)
    const today = new Date()
    const daysRemaining = Math.ceil((warrantyEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysRemaining > 0) {
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Active Warranty</Badge>
    }
    return null
  }

  const getServiceDueStatus = (customer: Customer) => {
    if (customer.last_service_date) {
      const last = new Date(customer.last_service_date)
      const months = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24 * 30)
      if (months > 6) return <Badge className="bg-red-500 text-white hover:bg-red-600">Service Due</Badge>
    }
    return null
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

  const formatMoney = (n: number) => {
    try {
      return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
    } catch {
      return `$${Number(n).toFixed(2)}`
    }
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Customer Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Page {currentPage} of {totalPages} • {totalCustomers} total customers
          </p>
        </div>
        <Link href="/customers/new">
          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
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
            placeholder="Search customers by name, phone, or plate number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <Button variant="outline" className="h-12 bg-transparent">
          Filter
        </Button>
      </div>

      {/* Customer Table */}
      <Card className="relative">
        {paginationLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading customers...</span>
            </div>
          </div>
        )}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Customer</TableHead>
                <TableHead className="w-[150px]">Contact</TableHead>
                <TableHead className="w-[120px]">Vehicle</TableHead>
                <TableHead className="w-[100px]">Services</TableHead>
                <TableHead className="w-[100px]">Total Spent</TableHead>
                <TableHead className="w-[100px]">Last Service</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[150px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {customer.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="text-sm text-muted-foreground">
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {customer.latest_vehicle_plate || "No Vehicle"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.latest_vehicle_model || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Total: {customer.service_count}</div>
                      <div className="text-xs text-muted-foreground">
                        Completed: {customer.completed_services}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatMoney(customer.total_spent)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {customer.last_service_date
                        ? new Date(customer.last_service_date).toLocaleDateString()
                        : "Never"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getWarrantyStatus(customer)}
                      {getServiceDueStatus(customer)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation()
                          await fetchCustomerDetails(customer.id)
                          setIsDetailsOpen(true)
                          const url = new URL(window.location.href)
                          url.searchParams.set("view", customer.id)
                          router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false })
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Link href={`/services/new?customer=${customer.id}`}>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Service
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                <h3 className="mb-3 text-sm font-semibold tracking-tight">Customer Overview</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border bg-muted/40 p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">{selectedCustomer.vehicle_count}</div>
                    <div className="text-xs text-muted-foreground">Vehicles</div>
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
                    <div className="text-lg font-bold text-purple-600">{formatMoney(selectedCustomer.total_spent)}</div>
                    <div className="text-xs text-muted-foreground">Total Spent</div>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h3 className="mb-2 text-sm font-semibold tracking-tight">Contact Information</h3>
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
                <h3 className="mb-2 text-sm font-semibold tracking-tight">Vehicles ({selectedCustomer.vehicle_count})</h3>
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
                <h3 className="mb-2 text-sm font-semibold tracking-tight">Recent Service History</h3>
                <div className="space-y-2">
                  {(selectedCustomer.recent_services ?? []).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border bg-background px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{s.service_type_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(s.service_date).toLocaleDateString()} • {s.plate_number} • {s.vehicle_model}
                        </div>
                        {s.technician_name && (
                          <div className="text-xs text-muted-foreground">Technician: {s.technician_name}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 pl-4">
                        <div className="text-sm font-semibold tabular-nums">
                          {formatMoney(Number(s.total_amount || 0))}
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
                            {booking.plate_number} • {booking.vehicle_model}
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

