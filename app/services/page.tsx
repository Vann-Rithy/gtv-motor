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
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"

type ServiceRow = {
  id: number
  invoice_number: string
  service_date: string
  total_amount: number
  service_status: "pending" | "in_progress" | "completed" | string
  payment_status: "pending" | "paid" | "cancelled" | string
  payment_method?: string | null
  service_type_name?: string
  service_detail?: string | null
  plate_number?: string
  vehicle_plate?: string
  vehicle_model?: string
  vehicle_model_name?: string
  vehicle_model_category?: string
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
  const { t } = useLanguage()
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
  const servicesPerPage = 12
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
        <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          {t('services.new', 'New Service')}
        </Button>
      </Link>
    ),
    [t],
  )

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{t('services.title', 'Service Management')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('common.page', 'Page')} {currentPage} {t('common.of', 'of')} {totalPages} • {totalServices} {t('services.total', 'total services')}
          </p>
        </div>
        {headerRight}
      </div>

      {/* Search + Status */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('services.search', 'Search by customer, invoice, or vehicle...')}
            className="pl-10 h-11"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-md border bg-background px-3 text-sm"
          aria-label={t('services.filter_status', 'Filter by status')}
        >
          <option value="">{t('services.status.all', 'All Status')}</option>
          <option value="completed">{t('services.status.completed', 'Completed')}</option>
          <option value="in_progress">{t('services.status.in_progress', 'In Progress')}</option>
          <option value="pending">{t('services.status.pending', 'Pending')}</option>
        </select>
      </div>

       {/* Services Cards */}
       {loading ? (
         <div className="flex items-center justify-center py-12">
           <div className="text-center">
             <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
             <div className="text-gray-600 dark:text-gray-400">{t('services.loading', 'Loading services...')}</div>
           </div>
         </div>
       ) : error ? (
         <div className="flex items-center justify-center py-12">
           <div className="text-center text-red-600 dark:text-red-400">
             {error}
           </div>
         </div>
       ) : rows.length === 0 ? (
         <div className="flex items-center justify-center py-12">
           <div className="text-center text-muted-foreground">
             {t('services.no_services', 'No services found.')}
           </div>
         </div>
       ) : (
         <div className="space-y-3">
           {rows.map((s) => (
             <Card key={s.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
               <CardContent className="p-4">
                 {/* Header Row */}
                 <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center space-x-3">
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                       <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                     </div>
                     <div>
                       <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                         {s.invoice_number}
                       </h3>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <Badge
                       className={
                         s.service_status === "completed"
                           ? "bg-green-500 text-white px-2 py-1 text-xs"
                           : s.service_status === "in_progress"
                             ? "bg-blue-500 text-white px-2 py-1 text-xs"
                             : "bg-yellow-500 text-white px-2 py-1 text-xs"
                       }
                     >
                       {STATUS_LABELS[s.service_status] || s.service_status}
                     </Badge>
                     <Badge
                       className={
                         s.payment_status === "paid"
                           ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 px-2 py-1 text-xs"
                           : s.payment_status === "cancelled"
                             ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 px-2 py-1 text-xs"
                             : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 px-2 py-1 text-xs"
                       }
                     >
                       {PAYMENT_LABELS[s.payment_status] || s.payment_status}
                     </Badge>
                   </div>
                 </div>

                 {/* Customer & Vehicle Info */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                   <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                     <div className="flex items-center mb-1">
                       <User className="h-3 w-3 text-gray-500 mr-1" />
                       <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Customer</span>
                     </div>
                     <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                       {s.customer_name || "—"}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                       {s.customer_phone || "No phone"}
                     </p>
                   </div>

                   <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                     <div className="flex items-center mb-1">
                       <Car className="h-3 w-3 text-gray-500 mr-1" />
                       <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Vehicle</span>
                     </div>
                     <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                       {s.vehicle_plate || s.plate_number}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                       {s.vehicle_model_name || s.vehicle_model} {s.vehicle_model_category ? `(${s.vehicle_model_category})` : ""}
                     </p>
                   </div>

                   <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                     <div className="flex items-center mb-1">
                       <Calendar className="h-3 w-3 text-gray-500 mr-1" />
                       <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Date</span>
                     </div>
                     <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                       {s.service_date ? new Date(s.service_date).toLocaleDateString() : "—"}
                     </p>
                   </div>
                 </div>

                 {/* Service Details */}
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                   <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                     <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Service Type</div>
                     <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                       {s.service_type_name || "—"}
                     </div>
                   </div>

                   <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                     <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Amount</div>
                     <div className="text-lg font-bold text-green-600 dark:text-green-400">
                       {toMoney(s.total_amount)}
                     </div>
                   </div>

                   <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                     <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Payment</div>
                     <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                       {s.payment_method || "—"}
                     </div>
                   </div>

                   <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                     <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Technician</div>
                     <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                       {s.technician_name || (s.technician_id ? `Tech #${s.technician_id}` : "—")}
                     </div>
                   </div>
                 </div>

                 {/* Notes Section */}
                 {s.notes && (
                   <div className="mb-3">
                     <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-400 p-2 rounded-r-md">
                       <div className="flex items-start">
                         <div className="flex-shrink-0">
                           <div className="h-3 w-3 text-yellow-400">📝</div>
                         </div>
                         <div className="ml-2">
                           <h4 className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                             Notes
                           </h4>
                           <p className="mt-0.5 text-xs text-yellow-700 dark:text-yellow-300">
                             {s.notes}
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Action Buttons */}
                 <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                   <Link href={`/services/${s.id}`}>
                     <Button variant="outline" size="sm" className="px-3 text-xs">
                       <Eye className="h-3 w-3 mr-1" />
                       View
                     </Button>
                   </Link>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleChangePayment(s.id, s.payment_status)}
                     className="px-3 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/20"
                   >
                     <CreditCard className="h-3 w-3 mr-1" />
                     Payment
                   </Button>
                   <Link href={`/services/${s.id}/invoice`}>
                     <Button size="sm" className="px-3 text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                       <DollarSign className="h-3 w-3 mr-1" />
                       Invoice
                     </Button>
                   </Link>
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
       )}

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Change Payment Status</h3>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
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
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
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
