"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  AlertTriangle, 
  Phone, 
  Car, 
  Calendar, 
  MapPin, 
  Mail,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  FileText,
  Wrench,
  Settings
} from "lucide-react"
import { WarrantyWithDetails } from "@/lib/types"
import { toast } from "sonner"
import { API_ENDPOINTS } from "@/lib/api-config"

export default function WarrantyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [warranty, setWarranty] = useState<WarrantyWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchWarranty = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_ENDPOINTS.WARRANTIES}?id=${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch warranty")
        }
        const responseData = await response.json()
        
        // Extract warranty data from API response structure
        const warrantyData = responseData.data || responseData
        
        // If data is an array, find the specific warranty by ID
        let warranty
        if (Array.isArray(warrantyData)) {
          warranty = warrantyData.find(w => w.id === params.id)
          if (!warranty) {
            throw new Error("Warranty not found")
          }
        } else {
          warranty = warrantyData
        }
        
        setWarranty(warranty)
      } catch (error) {
        console.error("Error fetching warranty:", error)
        
        // Fallback to sample data when API fails
        const fallbackWarranty = {
          id: parseInt(params.id as string) || 27,
          vehicle_id: 101,
          warranty_type: "standard",
          start_date: "2025-10-01",
          end_date: "2026-10-01",
          km_limit: 15000,
          max_services: 2,
          terms_conditions: "Standard warranty coverage",
          status: "active",
          created_at: "2025-09-30 15:35:10",
          updated_at: "2025-09-30 15:35:10",
          warranty_start_date: "2025-09-30",
          warranty_end_date: "2026-09-30",
          warranty_cost_covered: "0.00",
          customer_name: "Demo Customer",
          customer_phone: "012345678",
          customer_email: "demo@example.com",
          customer_address: "Phnom Penh, Cambodia",
          vehicle_plate: "DEMO-101",
          vehicle_vin: "VIN123456789",
          vehicle_year: 2023,
          vehicle_model: "SOBEN",
          vehicle_category: "SUV",
          current_km: 25000,
          services_used: 2,
          last_service_date: "2025-09-15",
          total_services_amount: 450.00,
          services: [
            {
              id: 1,
              service_date: "2025-09-15",
              total_amount: 150.00,
              service_status: "completed",
              current_km_at_service: 20000,
              warranty_used: 1,
              cost_covered: 150.00,
              service_type_name: "Oil Change"
            },
            {
              id: 2,
              service_date: "2025-08-10",
              total_amount: 300.00,
              service_status: "completed",
              current_km_at_service: 15000,
              warranty_used: 1,
              cost_covered: 300.00,
              service_type_name: "Maintenance"
            }
          ],
          claims: [
            {
              id: 1,
              claim_type: "engine_repair",
              claim_date: "2025-09-20",
              description: "Engine noise complaint",
              status: "pending",
              estimated_cost: 500.00,
              approved_amount: null
            }
          ],
          warranty_components: {
            'Engine': {
              years: 10,
              kilometers: 200000,
              applicable: true,
              remaining_years: 9.5,
              remaining_km: 175000,
              status: 'active'
            },
            'Car Paint': {
              years: 10,
              kilometers: 200000,
              applicable: true,
              remaining_years: 9.5,
              remaining_km: 175000,
              status: 'active'
            },
            'Transmission (gearbox)': {
              years: 5,
              kilometers: 100000,
              applicable: true,
              remaining_years: 4.5,
              remaining_km: 75000,
              status: 'active'
            },
            'Electrical System': {
              years: 5,
              kilometers: 100000,
              applicable: true,
              remaining_years: 4.5,
              remaining_km: 75000,
              status: 'active'
            },
            'Battery Hybrid': {
              years: 0,
              kilometers: 0,
              applicable: false,
              remaining_years: 0,
              remaining_km: 0,
              status: 'not_applicable'
            }
          },
          debug_fallback_data: true
        }
        setWarranty(fallbackWarranty)
        toast.warning("Using demo data - API server unavailable")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchWarranty()
    }
  }, [params.id, router])

  const handleDeleteWarranty = async () => {
    if (!warranty) return

    try {
      const response = await fetch(`${API_ENDPOINTS.WARRANTIES}/${warranty.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to cancel warranty")
      }

      toast.success("Warranty cancelled successfully")
      router.push("/warranty")
    } catch (error) {
      console.error("Error cancelling warranty:", error)
      toast.error("Failed to cancel warranty")
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Loading...</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading warranty details...</p>
        </div>
      </div>
    )
  }

  if (!warranty) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Warranty Not Found</h1>
        </div>
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Warranty Not Found</h2>
          <p className="text-gray-600 mb-6">The warranty you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/warranty")}>
            Back to Warranties
          </Button>
        </div>
      </div>
    )
  }

  // Safe warranty data with fallbacks - handle actual API response structure
  const safeWarranty = {
    id: parseInt(warranty.id) || 0,
    vehicle_id: parseInt(warranty.vehicle_id) || 0,
    warranty_type: warranty.warranty_type || 'standard',
    start_date: warranty.start_date || new Date().toISOString(),
    end_date: warranty.end_date || new Date().toISOString(),
    km_limit: parseInt(warranty.km_limit) || 0,
    max_services: parseInt(warranty.max_services) || 0,
    terms_conditions: warranty.terms_conditions || '',
    customer_name: warranty.customer_name || 'Unknown Customer',
    customer_phone: warranty.customer_phone || '',
    vehicle_plate: warranty.vehicle_plate || 'Unknown Plate',
    vehicle_model: warranty.vehicle_model || 'Unknown Model',
    current_km: parseInt(warranty.current_km) || 0,
    services_used: warranty.services_used || 0,
    last_service_date: warranty.last_service_date || null,
    total_services_amount: parseFloat(warranty.total_services_amount) || 0,
    services: warranty.services || [],
    claims: warranty.claims || []
  }

  // Calculate warranty status
  const getWarrantyStatus = () => {
    const now = new Date()
    const endDate = new Date(safeWarranty.end_date)
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 30) return 'expiring_soon'
    return 'active'
  }

  const warrantyStatus = getWarrantyStatus()
  const statusColor = warrantyStatus === 'active' ? 'bg-green-100 text-green-800' : 
                     warrantyStatus === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' : 
                     'bg-red-100 text-red-800'

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* API Status Banner */}
      {warranty?.debug_fallback_data && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode:</strong> The API server is currently unavailable. 
                You are viewing sample warranty data for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Warranty Details
            </h1>
            <p className="text-gray-600">
              {safeWarranty.customer_name} - {safeWarranty.vehicle_plate}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeleteWarranty}>
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Warranty Summary */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">Warranty Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Warranty ID:</strong> {safeWarranty.id}</p>
              <p><strong>Vehicle ID:</strong> {safeWarranty.vehicle_id}</p>
              <p><strong>Type:</strong> {safeWarranty.warranty_type}</p>
              <p><strong>Start Date:</strong> {safeWarranty.start_date}</p>
              <p><strong>End Date:</strong> {safeWarranty.end_date}</p>
            </div>
            <div>
              <p><strong>KM Limit:</strong> {safeWarranty.km_limit.toLocaleString()}</p>
              <p><strong>Max Services:</strong> {safeWarranty.max_services}</p>
              <p><strong>Current KM:</strong> {safeWarranty.current_km.toLocaleString()}</p>
              <p><strong>Services Used:</strong> {safeWarranty.services_used}</p>
              <p><strong>Status:</strong> {warrantyStatus}</p>
            </div>
          </div>
          <div className="mt-4">
            <p><strong>Terms:</strong> {safeWarranty.terms_conditions}</p>
          </div>
        </CardContent>
      </Card>

      {/* Status Banner */}
      <Card className={`border-l-4 ${
        warrantyStatus === "active" ? "border-l-green-500" :
        warrantyStatus === "expiring_soon" ? "border-l-yellow-500" :
        "border-l-red-500"
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge className={statusColor}>
                  {warrantyStatus.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
                <Badge variant="outline">
                  {safeWarranty.warranty_type.replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              {warrantyStatus === "expiring_soon" && (
                <div className="flex items-center space-x-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Expires soon
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Warranty Status</p>
              <p className="text-lg font-semibold">
                {warrantyStatus === "active" ? "Active" :
                 warrantyStatus === "expiring_soon" ? "Expiring Soon" :
                 "Expired"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer & Vehicle Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>Customer & Vehicle</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-medium">{safeWarranty.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{safeWarranty.customer_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Plate</p>
                    <p className="font-medium">{safeWarranty.vehicle_plate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Model</p>
                    <p className="font-medium">{safeWarranty.vehicle_model}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warranty Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Warranty Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium">
                      {new Date(safeWarranty.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium">
                      {new Date(safeWarranty.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{safeWarranty.warranty_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">
                      {warrantyStatus === "active" ? "Active" :
                       warrantyStatus === "expiring_soon" ? "Expiring Soon" :
                       "Expired"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Usage Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {safeWarranty.current_km.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-500">Current KM</p>
                  <p className="text-xs text-gray-400">
                    of {safeWarranty.km_limit.toLocaleString()} limit
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {safeWarranty.services_used}
                  </div>
                  <p className="text-sm text-gray-500">Services Used</p>
                  <p className="text-xs text-gray-400">
                    of {safeWarranty.max_services} limit
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((safeWarranty.current_km / safeWarranty.km_limit) * 100)}%
                  </div>
                  <p className="text-sm text-gray-500">KM Usage</p>
                  <p className="text-xs text-gray-400">
                    Coverage percentage
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          {safeWarranty.terms_conditions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Terms & Conditions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {safeWarranty.terms_conditions}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Warranty Components</h3>
            <Badge variant="outline">
              {safeWarranty.vehicle_model || 'Unknown Model'}
            </Badge>
          </div>
          
          {warranty.warranty_components ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(warranty.warranty_components).map(([componentName, component]) => (
                <Card key={componentName} className={`border-l-4 ${
                  component.status === 'active' ? 'border-l-green-500' :
                  component.status === 'expired' ? 'border-l-red-500' :
                  component.status === 'not_applicable' ? 'border-l-gray-500' :
                  'border-l-yellow-500'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{componentName}</span>
                      <Badge className={
                        component.status === 'active' ? 'bg-green-100 text-green-800' :
                        component.status === 'expired' ? 'bg-red-100 text-red-800' :
                        component.status === 'not_applicable' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {component.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {component.applicable ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Original Warranty</p>
                            <p className="font-medium">{component.years} Years / {component.kilometers.toLocaleString()} km</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Remaining</p>
                            <p className="font-medium">{component.remaining_years} Years / {component.remaining_km.toLocaleString()} km</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Time Coverage</span>
                            <span>{Math.round((component.remaining_years / component.years) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.round((component.remaining_years / component.years) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>KM Coverage</span>
                            <span>{Math.round((component.remaining_km / component.kilometers) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${Math.round((component.remaining_km / component.kilometers) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Not applicable for this vehicle model</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Component warranty information not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Warranty Services</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
          
          {safeWarranty.services && safeWarranty.services.length > 0 ? (
            <div className="space-y-4">
              {safeWarranty.services.map((service: any, index: number) => (
                <Card key={service.id || index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Settings className="h-8 w-8 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{service.service_type_name || 'Unknown Service'}</h4>
                          <p className="text-sm text-gray-500">
                            {service.service_date ? new Date(service.service_date).toLocaleDateString() : 'N/A'} • {service.km_at_service ? service.km_at_service.toLocaleString() : 'N/A'} km
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(service.cost_covered || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">Covered</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No services recorded under this warranty yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Services will appear here once they are performed under this warranty.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Warranty Claims</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Claim
            </Button>
          </div>
          
          {safeWarranty.claims && safeWarranty.claims.length > 0 ? (
            <div className="space-y-4">
              {safeWarranty.claims.map((claim: any, index: number) => (
                <Card key={claim.id || index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-orange-500" />
                        <div>
                          <h4 className="font-medium">{(claim.claim_type || 'Unknown').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                          <p className="text-sm text-gray-500">
                            {claim.claim_date ? new Date(claim.claim_date).toLocaleDateString() : 'N/A'} • {claim.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          claim.status === "approved" ? "bg-green-100 text-green-800" :
                          claim.status === "rejected" ? "bg-red-100 text-red-800" :
                          claim.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {(claim.status || 'unknown').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        {claim.estimated_cost && (
                          <p className="text-sm text-gray-500 mt-1">
                            Est: ${(claim.estimated_cost || 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No claims filed for this warranty yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Warranty Documents</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded for this warranty yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
