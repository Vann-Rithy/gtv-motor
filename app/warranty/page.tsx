"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Shield, AlertTriangle, Phone, Car, RefreshCw, Calendar } from "lucide-react"
import { WarrantyWithDetails } from "@/lib/types"
import { calculateWarrantyStatus, getWarrantyStatusColor, getWarrantyTypeDisplayName } from "@/lib/warranty-utils"
import { toast } from "sonner"

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState<WarrantyWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [refreshing, setRefreshing] = useState(false)

  // Fetch warranties from API
  const fetchWarranties = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/warranties?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch warranties")
      }

      const data = await response.json()
      console.log("Warranty API response:", data) // Debug log

      if (data.success && data.data) {
        setWarranties(data.data)
      } else {
        console.error("Invalid warranty data structure:", data)
        setWarranties([])
        toast.error("Invalid warranty data received")
      }
    } catch (error) {
      console.error("Error fetching warranties:", error)
      toast.error("Failed to load warranties")
    } finally {
      setLoading(false)
    }
  }

  // Refresh warranties
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchWarranties()
    setRefreshing(false)
    toast.success("Warranties refreshed")
  }

  // Fetch warranties on component mount and when filters change
  useEffect(() => {
    fetchWarranties()
  }, [statusFilter])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchWarranties()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const getStatusBadge = (warranty: WarrantyWithDetails) => {
    const calculatedStatus = calculateWarrantyStatus(warranty)
    const statusColor = getWarrantyStatusColor(calculatedStatus.status)

    return (
      <Badge className={statusColor}>
        {calculatedStatus.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  // Calculate summary statistics
  const activeWarranties = warranties.filter(w => calculateWarrantyStatus(w).status === "active").length
  const expiringWarranties = warranties.filter(w => calculateWarrantyStatus(w).status === "expiring_soon").length
  const expiredWarranties = warranties.filter(w => calculateWarrantyStatus(w).status === "expired").length

  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Warranty Management</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading warranties...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Warranty Management</h1>
        </div>
                 <div className="flex space-x-2">
           <Button
             variant="outline"
             size="sm"
             onClick={handleRefresh}
             disabled={refreshing}
           >
             <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
             Refresh
           </Button>
         </div>
      </div>

             {/* Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Active Warranties</CardTitle>
             <Shield className="h-4 w-4 text-green-500" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-green-600">{activeWarranties}</div>
             <p className="text-xs text-muted-foreground">Currently active</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
             <AlertTriangle className="h-4 w-4 text-yellow-500" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-yellow-600">{expiringWarranties}</div>
             <p className="text-xs text-muted-foreground">Require attention</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Expired</CardTitle>
             <AlertTriangle className="h-4 w-4 text-red-500" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-red-600">{expiredWarranties}</div>
             <p className="text-xs text-muted-foreground">No longer covered</p>
           </CardContent>
         </Card>
       </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search warranties by customer, phone, or vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "expiring_soon" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("expiring_soon")}
              >
                Expiring
              </Button>
              <Button
                variant={statusFilter === "expired" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("expired")}
              >
                Expired
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warranty List */}
      <Card>
        <CardHeader>
          <CardTitle>Warranty Records</CardTitle>
          <CardDescription>Track and manage vehicle warranties with data from customers, vehicles, and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {warranties.map((warranty) => {
              const calculatedStatus = calculateWarrantyStatus(warranty)
              const kmPercentage = Math.min(((warranty.current_km || 0) / Math.max(warranty.km_limit || 1, 1)) * 100, 100)
              const servicePercentage = ((warranty.services_used || 0) / Math.max(warranty.max_services || 1, 1)) * 100

              return (
                <div
                  key={warranty.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg transition-colors duration-150
                    hover:bg-gray-50 dark:hover:bg-gray-800
                    bg-white dark:bg-gray-900
                    border-gray-200 dark:border-gray-700
                    space-y-4 lg:space-y-0 cursor-pointer"
                  onClick={() => window.open(`/warranty/${warranty.id}`, '_blank')}
                >
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{warranty.customer_name}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {warranty.customer_phone}
                          </div>
                          <div className="flex items-center">
                            <Car className="h-4 w-4 mr-1" />
                            {warranty.vehicle_plate} - {warranty.vehicle_model}
                          </div>
                          {warranty.customer_email && (
                            <div className="flex items-center">
                              <span className="text-xs">{warranty.customer_email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {getWarrantyTypeDisplayName(warranty.warranty_type)}
                        </Badge>
                        {getStatusBadge(warranty)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Warranty Period</p>
                        <p className="font-medium text-xs">
                          {new Date(warranty.start_date).toLocaleDateString()} - {new Date(warranty.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">KM Limit</p>
                        <p className="font-medium">
                          {warranty.current_km?.toLocaleString() || 0} / {warranty.km_limit.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Services Used</p>
                        <p className="font-medium">
                          {warranty.services_used} / {warranty.max_services}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Last Service</p>
                        <p className="font-medium text-xs">
                          {warranty.last_service_date
                            ? new Date(warranty.last_service_date).toLocaleDateString()
                            : "N/A"
                          }
                        </p>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Kilometers Used</span>
                          <span>{kmPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              kmPercentage >= 100
                                ? "bg-red-500"
                                : kmPercentage >= 80
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${kmPercentage}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Services Used</span>
                          <span>{servicePercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              servicePercentage >= 100
                                ? "bg-red-500"
                                : servicePercentage >= 80
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${servicePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      disabled={calculatedStatus.status === "expired" || calculatedStatus.status === "cancelled"}
                      title={calculatedStatus.status === "expired" || calculatedStatus.status === "cancelled" ? "Warranty not eligible for service" : "Create new service"}
                    >
                      New Service
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {warranties.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "No warranty records found matching your search."
                  : "No warranty records found. Create your first warranty to get started."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
