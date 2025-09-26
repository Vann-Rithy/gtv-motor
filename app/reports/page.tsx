"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Download,
  DollarSign,
  TrendingUp,
  Users,
  Shield,
  Package,
  Calendar,
  RefreshCw,
  FileText,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react"
import Link from "next/link"
import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from "@/lib/export-utils"

interface SummaryData {
  totalRevenue: number
  totalServices: number
  averageServiceValue: number
  topService: string
  customerGrowth: number
  servicesByType: Array<{
    type: string
    count: number
    revenue: number
  }>
  monthlyTrend: Array<{
    month: string
    revenue: number
    services: number
  }>
}

interface WarrantyData {
  summary: {
    totalWarranties: number
    activeWarranties: number
    expiredWarranties: number
    expiringSoon: number
    totalCostCovered: number
  }
  byStatus: Array<{
    status: string
    count: number
    totalCost: number
  }>
  claims: Array<{
    claimDate: string
    description: string
    amount: number
    status: string
    customerName: string
    vehiclePlate: string
    warrantyStart: string
    warrantyEnd: string
  }>
  services: Array<{
    serviceDate: string
    serviceType: string
    cost: number
    customerName: string
    vehiclePlate: string
    warrantyStart: string
    warrantyEnd: string
  }>
  monthlyTrend: Array<{
    month: string
    newWarranties: number
    totalCost: number
  }>
}

interface CustomerData {
  summary: {
    totalCustomers: number
    activeCustomers: number
    inactiveCustomers: number
    averageServiceValue: number
  }
  topCustomers: Array<{
    name: string
    phone: string
    email: string
    totalServices: number
    totalSpent: number
    averageServiceCost: number
    lastServiceDate: string
  }>
  retention: {
    repeatCustomers: number
    loyalCustomers: number
  }
  demographics: Array<{
    segment: string
    count: number
  }>
  servicePreferences: Array<{
    serviceType: string
    serviceCount: number
    uniqueCustomers: number
  }>
  monthlyAcquisition: Array<{
    month: string
    newCustomers: number
  }>
}

interface InventoryData {
  summary: {
    totalItems: number
    totalQuantity: number
    totalValue: number
    averageUnitPrice: number
  }
  byCategory: Array<{
    category: string
    itemCount: number
    totalQuantity: number
    totalValue: number
  }>
  lowStock: Array<{
    itemName: string
    category: string
    quantity: number
    unitPrice: number
    totalValue: number
    reorderLevel: number
  }>
  movements: Array<{
    movementDate: string
    movementType: string
    quantity: number
    unitPrice: number
    itemName: string
    category: string
    staffName: string
  }>
  monthlyTrend: Array<{
    month: string
    newItems: number
    totalQuantity: number
    totalValue: number
  }>
  topSelling: Array<{
    itemName: string
    category: string
    totalSold: number
    totalRevenue: number
    averagePrice: number
  }>
}

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  })
  const [activeTab, setActiveTab] = useState("summary")
  const [loading, setLoading] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [warrantyData, setWarrantyData] = useState<WarrantyData | null>(null)
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      // Fetch summary report
      const summaryResponse = await fetch(`/api/reports/summary?from=${dateRange.from}&to=${dateRange.to}`)
      if (summaryResponse.ok) {
        const summary = await summaryResponse.json()
        // Ensure all required properties exist with default values
        const safeSummary = {
          totalRevenue: summary.totalRevenue || 0,
          totalServices: summary.totalServices || 0,
          averageServiceValue: summary.averageServiceValue || 0,
          topService: summary.topService || 'N/A',
          customerGrowth: summary.customerGrowth || 0,
          servicesByType: summary.servicesByType || [],
          monthlyTrend: summary.monthlyTrend || []
        }
        setSummaryData(safeSummary)
        setErrors(prev => prev.filter(e => !e.includes('Summary')))
      } else {
        console.error("Summary report failed:", summaryResponse.status, summaryResponse.statusText)
        setErrors(prev => [...prev.filter(e => !e.includes('Summary')), `Summary report failed: ${summaryResponse.status}`])
      }

      // Fetch warranty report
      const warrantyResponse = await fetch(`/api/reports/warranty?from=${dateRange.from}&to=${dateRange.to}`)
      if (warrantyResponse.ok) {
        const warranty = await warrantyResponse.json()
        // Ensure all required properties exist with default values
        const safeWarranty = {
          summary: {
            totalWarranties: warranty.summary?.totalWarranties || 0,
            activeWarranties: warranty.summary?.activeWarranties || 0,
            expiredWarranties: warranty.summary?.expiredWarranties || 0,
            expiringSoon: warranty.summary?.expiringSoon || 0,
            totalCostCovered: warranty.summary?.totalCostCovered || 0
          },
          claims: warranty.claims || []
        }
        setWarrantyData(safeWarranty)
      } else {
        console.error("Warranty report failed:", warrantyResponse.status, warrantyResponse.statusText)
      }

      // Fetch customer report
      const customerResponse = await fetch(`/api/reports/customer?from=${dateRange.from}&to=${dateRange.to}`)
      if (customerResponse.ok) {
        const customer = await customerResponse.json()
        // Ensure all required properties exist with default values
        const safeCustomer = {
          summary: {
            totalCustomers: customer.summary?.totalCustomers || 0,
            activeCustomers: customer.summary?.activeCustomers || 0,
            averageServiceValue: customer.summary?.averageServiceValue || 0
          },
          retention: {
            repeatCustomers: customer.retention?.repeatCustomers || 0
          },
          topCustomers: customer.topCustomers || []
        }
        setCustomerData(safeCustomer)
      } else {
        console.error("Customer report failed:", customerResponse.status, customerResponse.statusText)
      }

      // Fetch inventory report
      const inventoryResponse = await fetch(`/api/reports/inventory?from=${dateRange.from}&to=${dateRange.to}`)
      if (inventoryResponse.ok) {
        const inventory = await inventoryResponse.json()
        // Ensure all required properties exist with default values
        const safeInventory = {
          summary: {
            totalItems: inventory.summary?.totalItems || 0,
            lowStockItems: inventory.summary?.lowStockItems || 0,
            totalValue: inventory.summary?.totalValue || 0
          },
          lowStock: inventory.lowStock || []
        }
        setInventoryData(safeInventory)
      } else {
        console.error("Inventory report failed:", inventoryResponse.status, inventoryResponse.statusText)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [dateRange.from, dateRange.to])

  const handleExportReport = async (format: string) => {
    try {
      let data: any

      // Get the appropriate data based on active tab
      switch (activeTab) {
        case 'summary':
          data = summaryData
          break
        case 'warranty':
          data = warrantyData
          break
        case 'customer':
          data = customerData
          break
        case 'inventory':
          data = inventoryData
          break
        default:
          alert('No data available for export')
          return
      }

      if (!data) {
        alert('Please generate a report first before exporting')
        return
      }

      // Format data for export
      const exportData = formatDataForExport(activeTab, data, dateRange)

      // Export based on format
      switch (format) {
        case 'CSV':
          exportToCSV(exportData)
          break
        case 'Excel':
          exportToExcel(exportData)
          break
        case 'PDF':
          await exportToPDF(exportData)
          break
        default:
          alert('Unsupported export format')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    }
  }

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0.00'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
            </div>
            <Button onClick={fetchReportData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Select date range and report type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="from-date">From Date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="to-date">To Date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button onClick={fetchReportData} disabled={loading} className="flex-1">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Generate Report
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Report Generation Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {(errors || []).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="warranty" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Warranty
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Summary Report */}
          <TabsContent value="summary" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading summary report...</p>
              </div>
            ) : summaryData && summaryData.servicesByType ? (
              <>
                {/* Export Button */}
                <div className="flex justify-end mb-4">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("CSV")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("Excel")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("PDF")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(summaryData.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">
                        {summaryData.customerGrowth > 0 ? '+' : ''}{(summaryData.customerGrowth || 0).toFixed(1)}% from last period
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryData.totalServices || 0}</div>
                      <p className="text-xs text-muted-foreground">Services completed</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Average Service Value</CardTitle>
                      <DollarSign className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(summaryData.averageServiceValue)}</div>
                      <p className="text-xs text-muted-foreground">Per service</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Top Service</CardTitle>
                      <Users className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summaryData.topService || 'N/A'}</div>
                      <p className="text-xs text-muted-foreground">Most requested</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Services by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Services by Type</CardTitle>
                    <CardDescription>Breakdown of services performed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(summaryData.servicesByType || []).map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{service.type}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{service.count || 0} services</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatCurrency(service.revenue)}</p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency((service.revenue || 0) / (service.count || 1))} avg
                            </p>
                          </div>
                          <div className="ml-4 w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${((service.count || 0) / (summaryData.totalServices || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Trend</CardTitle>
                    <CardDescription>Revenue and service trends over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(summaryData.monthlyTrend || []).map((month, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border-b">
                          <div className="font-medium w-16">{month.month}</div>
                          <div className="flex-1 mx-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Revenue: {formatCurrency(month.revenue)}</span>
                              <span>Services: {month.services}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${((month.revenue || 0) / Math.max(...(summaryData.monthlyTrend || []).map(m => m.revenue || 0), 1)) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No summary data available</p>
              </div>
            )}
          </TabsContent>

          {/* Warranty Report */}
          <TabsContent value="warranty" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading warranty report...</p>
              </div>
            ) : warrantyData && warrantyData.claims ? (
              <>
                {/* Export Button */}
                <div className="flex justify-end mb-4">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("CSV")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("Excel")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("PDF")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Warranty Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Warranties</CardTitle>
                      <Shield className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{warrantyData.summary.totalWarranties || 0}</div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active</CardTitle>
                      <Shield className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{warrantyData.summary.activeWarranties || 0}</div>
                      <p className="text-xs text-muted-foreground">Currently valid</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Expired</CardTitle>
                      <Shield className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{warrantyData.summary.expiredWarranties || 0}</div>
                      <p className="text-xs text-muted-foreground">No longer valid</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                      <Shield className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{warrantyData.summary.expiringSoon || 0}</div>
                      <p className="text-xs text-muted-foreground">Next 30 days</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Cost Covered</CardTitle>
                      <DollarSign className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(warrantyData.summary.totalCostCovered)}</div>
                      <p className="text-xs text-muted-foreground">Warranty value</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Warranty Claims */}
                <Card>
                  <CardHeader>
                    <CardTitle>Warranty Claims</CardTitle>
                    <CardDescription>Recent warranty claims and their status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(warrantyData.claims || []).slice(0, 10).map((claim, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{claim.customerName}</h3>
                            <p className="text-sm text-gray-500">{claim.vehiclePlate}</p>
                            <p className="text-sm text-gray-600">{claim.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatCurrency(claim.amount)}</p>
                            <Badge variant={claim.status === 'approved' ? 'default' : 'secondary'}>
                              {claim.status}
                            </Badge>
                            <p className="text-sm text-gray-500">{formatDate(claim.claimDate)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No warranty data available</p>
              </div>
            )}
          </TabsContent>

          {/* Customer Report */}
          <TabsContent value="customer" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading customer report...</p>
              </div>
            ) : customerData && customerData.topCustomers ? (
              <>
                {/* Export Button */}
                <div className="flex justify-end mb-4">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("CSV")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("Excel")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("PDF")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Customer Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                      <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{customerData.summary.totalCustomers || 0}</div>
                      <p className="text-xs text-muted-foreground">All customers</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                      <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{customerData.summary.activeCustomers || 0}</div>
                      <p className="text-xs text-muted-foreground">With recent services</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
                      <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{customerData.retention.repeatCustomers || 0}</div>
                      <p className="text-xs text-muted-foreground">Multiple services</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Average Service Value</CardTitle>
                      <DollarSign className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(customerData.summary.averageServiceValue)}</div>
                      <p className="text-xs text-muted-foreground">Per customer</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Customers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Customers by Revenue</CardTitle>
                    <CardDescription>Highest spending customers in the period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(customerData.topCustomers || []).map((customer, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{customer.name}</h3>
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                            <p className="text-sm text-gray-600">{customer.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatCurrency(customer.totalSpent)}</p>
                            <p className="text-sm text-gray-500">{customer.totalServices} services</p>
                            <p className="text-sm text-gray-500">Last: {formatDate(customer.lastServiceDate)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No customer data available</p>
              </div>
            )}
          </TabsContent>

          {/* Inventory Report */}
          <TabsContent value="inventory" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading inventory report...</p>
              </div>
            ) : inventoryData && inventoryData.lowStock ? (
              <>
                {/* Export Button */}
                <div className="flex justify-end mb-4">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("CSV")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("Excel")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport("PDF")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Inventory Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                      <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{inventoryData.summary.totalItems}</div>
                      <p className="text-xs text-muted-foreground">Unique items</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                      <Package className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{inventoryData.summary.totalQuantity}</div>
                      <p className="text-xs text-muted-foreground">Units in stock</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                      <DollarSign className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(inventoryData.summary.totalValue)}</div>
                      <p className="text-xs text-muted-foreground">Inventory worth</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                      <Package className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{inventoryData.lowStock.length}</div>
                      <p className="text-xs text-muted-foreground">Need reorder</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Low Stock Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Low Stock Items</CardTitle>
                    <CardDescription>Items that need reordering</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(inventoryData.lowStock || []).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{item.itemName}</h3>
                            <p className="text-sm text-gray-500">{item.category}</p>
                            <p className="text-sm text-gray-600">Reorder Level: {item.reorderLevel}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{item.quantity}</p>
                            <p className="text-sm text-gray-500">in stock</p>
                            <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No inventory data available</p>
              </div>
            )}
          </TabsContent>

          {/* Export Options */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Reports</CardTitle>
                <CardDescription>Download reports in various formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport("PDF")}
                    className="h-24 flex-col"
                    disabled={!summaryData && !warrantyData && !customerData && !inventoryData}
                  >
                    <Download className="h-8 w-8 mb-2" />
                    Export as PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport("Excel")}
                    className="h-24 flex-col"
                    disabled={!summaryData && !warrantyData && !customerData && !inventoryData}
                  >
                    <Download className="h-8 w-8 mb-2" />
                    Export as Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport("CSV")}
                    className="h-24 flex-col"
                    disabled={!summaryData && !warrantyData && !customerData && !inventoryData}
                  >
                    <Download className="h-8 w-8 mb-2" />
                    Export as CSV
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Export Options:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>PDF:</strong> Professional formatted reports for printing and sharing</li>
                    <li>• <strong>Excel:</strong> Spreadsheet format for data analysis and manipulation</li>
                    <li>• <strong>CSV:</strong> Simple text format for importing into other systems</li>
                  </ul>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Export Current Report:</h4>
                    <p className="text-sm text-blue-700">
                      The export will include data from the currently active report tab.
                      Make sure to generate the report first and select the desired tab.
                    </p>
                    {activeTab !== 'export' && (
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>Current Tab:</strong> {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
