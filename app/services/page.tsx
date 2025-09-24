// app/services/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Search, Eye, DollarSign, Calendar, User, Car, Phone, ChevronLeft, ChevronRight, ArrowUpDown, CreditCard } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

type ServiceRow = {
  id: number
  invoice_number: string
  service_date: string
  total_amount: number
  service_status: "pending" | "in_progress" | "completed" | string
  payment_status: "pending" | "paid" | "cancelled" | string
  payment_method?: string | null
  service_type_name: string
  service_detail?: string | null
  plate_number: string
  vehicle_model: string
  vehicle_year?: number | null
  customer_name?: string
  customer_phone?: string | null
  technician_name?: string | null
  technician_id?: number | null
  notes?: string | null
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


export default function ServicesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalServices, setTotalServices] = useState(0)
  const [sortBy, setSortBy] = useState("service_date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const servicesPerPage = 10
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("")
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)

  const fetchData = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const res = await apiClient.getServices({
        search: search || undefined,
        status: status || undefined,
        limit: servicesPerPage,
        page: page,
      })
      setRows((res?.data || []) as ServiceRow[])
      setError(null)
      
      // Update pagination info
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1)
        setTotalServices(res.pagination.total || rows.length)
      } else {
        setTotalPages(1)
        setTotalServices(rows.length)
      }
    } catch (e: any) {
      console.error("[services] fetch error:", e)
      setError(e?.message || "Failed to fetch services")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortBy, sortOrder])

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching/filtering
      fetchData(1)
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const handleChangePayment = (serviceId: number, currentStatus: string) => {
    setSelectedServiceId(serviceId)
    setSelectedPaymentStatus(currentStatus)
    setShowPaymentModal(true)
  }

  const handleUpdatePayment = async () => {
    if (!selectedServiceId || !selectedPaymentStatus) return

    setIsUpdatingPayment(true)
    try {
      const response = await apiClient.updateService(selectedServiceId, {
        payment_status: selectedPaymentStatus
      })
      
      // Show success message with automatic status change info
      if (selectedPaymentStatus === 'paid') {
        toast.success("Payment status updated to Paid. Service automatically marked as Completed.")
      } else if (selectedPaymentStatus === 'cancelled') {
        toast.success("Payment status updated to Cancelled. Service automatically marked as Cancelled.")
      } else {
        toast.success("Payment status updated successfully.")
      }
      
      // Refresh the data
      await fetchData(currentPage)
      setShowPaymentModal(false)
      setSelectedServiceId(null)
      setSelectedPaymentStatus("")
    } catch (error) {
      console.error("Failed to update payment status:", error)
      toast.error("Failed to update payment status")
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const headerRight = useMemo(
    () => (
      <Link href="/services/new">
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </Link>
    ),
    [],
  )

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Service Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Page {currentPage} of {totalPages} • {totalServices} total services
          </p>
        </div>
        {headerRight}
      </div>

      {/* Search + Status */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, invoice, or vehicle..."
            className="pl-10 h-11"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-md border bg-background px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("invoice_number")}
                    className="h-auto p-0 font-semibold"
                  >
                    Invoice
                    {sortBy === "invoice_number" && (
                      <span className="ml-1 text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortBy !== "invoice_number" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[180px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("customer_name")}
                    className="h-auto p-0 font-semibold"
                  >
                    Customer
                    {sortBy === "customer_name" && (
                      <span className="ml-1 text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortBy !== "customer_name" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">Phone</TableHead>
                <TableHead className="w-[150px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("vehicle_model")}
                    className="h-auto p-0 font-semibold"
                  >
                    Vehicle
                    {sortBy === "vehicle_model" && (
                      <span className="ml-1 text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortBy !== "vehicle_model" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[80px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("vehicle_year")}
                    className="h-auto p-0 font-semibold"
                  >
                    Year
                    {sortBy === "vehicle_year" && (
                      <span className="ml-1 text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortBy !== "vehicle_year" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("service_date")}
                    className="h-auto p-0 font-semibold"
                  >
                    Service Date
                    {sortBy === "service_date" && (
                      <span className="ml-1 text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortBy !== "service_date" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">Service Type</TableHead>
                <TableHead className="w-[200px]">Service Detail</TableHead>
                <TableHead className="w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("total_amount")}
                    className="h-auto p-0 font-semibold"
                  >
                    Amount
                    {sortBy === "total_amount" && (
                      <span className="ml-1 text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortBy !== "total_amount" && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Payment</TableHead>
                <TableHead className="w-[120px]">Technician</TableHead>
                <TableHead className="w-[150px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading services...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12 text-red-600">
                    {error}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                    No services found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((s) => {
                  const statusTone =
                    s.service_status === "completed" ? "green" : s.service_status === "in_progress" ? "blue" : "yellow"
                  const payTone = s.payment_status === "paid" ? "green" : s.payment_status === "cancelled" ? "red" : "yellow"

                  return (
                    <TableRow key={s.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{s.invoice_number}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="truncate">{s.customer_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{s.customer_phone || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{s.vehicle_model}</div>
                            <div className="text-xs text-muted-foreground">{s.plate_number}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{s.vehicle_year || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">
                            {s.service_date ? new Date(s.service_date).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{s.service_type_name || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-700 max-w-[200px] truncate" title={s.service_detail || ""}>
                          {s.service_detail || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{toMoney(s.total_amount)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.service_status === "completed"
                              ? "default"
                              : s.service_status === "in_progress"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            s.service_status === "completed"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : s.service_status === "in_progress"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }
                        >
                          {STATUS_LABELS[s.service_status] || s.service_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.payment_status === "paid"
                              ? "default"
                              : s.payment_status === "cancelled"
                                ? "destructive"
                                : "outline"
                          }
                          className={
                            s.payment_status === "paid"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : s.payment_status === "cancelled"
                                ? "bg-red-100 text-red-800 hover:bg-red-200"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }
                        >
                          {PAYMENT_LABELS[s.payment_status] || s.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {s.technician_name || (s.technician_id ? `Tech #${s.technician_id}` : "—")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/services/${s.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleChangePayment(s.id, s.payment_status)}
                            className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Change Payment
                          </Button>
                          <Link href={`/services/${s.id}/invoice`}>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <DollarSign className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {rows.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * servicesPerPage) + 1} to {Math.min(currentPage * servicesPerPage, totalServices)} of {totalServices} services
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
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
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Change Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Change Payment Status</h3>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                  <strong>Note:</strong> Setting payment to "Paid" will automatically mark the service as "Completed". 
                  Setting payment to "Cancelled" will automatically mark the service as "Cancelled".
                </div>
                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={selectedPaymentStatus}
                    onValueChange={setSelectedPaymentStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={isUpdatingPayment}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdatePayment}
                    disabled={isUpdatingPayment}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isUpdatingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Payment"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
