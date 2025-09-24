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
  Wrench
} from "lucide-react"
import { WarrantyWithDetails } from "@/lib/types"
import { 
  calculateWarrantyStatus, 
  getWarrantyStatusColor, 
  getWarrantyTypeDisplayName,
  formatWarrantyDuration,
  calculateWarrantyCoverage
} from "@/lib/warranty-utils"
import { toast } from "sonner"

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
        const response = await fetch(`/api/warranties/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch warranty")
        }
        const data = await response.json()
        setWarranty(data)
      } catch (error) {
        console.error("Error fetching warranty:", error)
        toast.error("Failed to load warranty details")
        router.push("/warranty")
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

    if (!confirm("Are you sure you want to cancel this warranty? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/warranties/${warranty.id}`, {
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
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Warranty Not Found</h1>
        </div>
      </div>
    )
  }

  const calculatedStatus = calculateWarrantyStatus(warranty)
  const coverage = calculateWarrantyCoverage(warranty)

  return (
    <div className="p-4 lg:p-8 space-y-6">
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
              {warranty.customer_name} - {warranty.vehicle_plate}
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

      {/* Status Banner */}
      <Card className={`border-l-4 ${
        calculatedStatus.status === "active" ? "border-l-green-500" :
        calculatedStatus.status === "expiring_soon" ? "border-l-yellow-500" :
        "border-l-red-500"
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge className={getWarrantyStatusColor(calculatedStatus.status)}>
                  {calculatedStatus.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
                <Badge variant="outline">
                  {getWarrantyTypeDisplayName(warranty.warranty_type)}
                </Badge>
              </div>
              {calculatedStatus.status === "expiring_soon" && (
                <div className="flex items-center space-x-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Expires in {calculatedStatus.daysUntilExpiry} days
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Warranty ID</p>
              <p className="font-mono text-sm">#{warranty.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
                  <span>Vehicle & Customer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{warranty.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {warranty.customer_phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle</p>
                    <p className="font-medium">{warranty.vehicle_plate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Model</p>
                    <p className="font-medium">{warranty.vehicle_model}</p>
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
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">
                      {formatWarrantyDuration(warranty.start_date, warranty.end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Period</p>
                    <p className="font-medium">
                      {new Date(warranty.start_date).toLocaleDateString()} - {new Date(warranty.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">KM Limit</p>
                    <p className="font-medium">
                      {warranty.km_limit.toLocaleString()} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Services</p>
                    <p className="font-medium">{warranty.max_services}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage & Coverage */}
          <Card>
            <CardHeader>
              <CardTitle>Usage & Coverage</CardTitle>
              <CardDescription>
                Current usage statistics and coverage percentages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Kilometer Usage */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Kilometers</span>
                    <span className="text-sm text-gray-500">
                      {warranty.current_km.toLocaleString()} / {warranty.km_limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        coverage.kmCoverage >= 100 ? "bg-red-500" :
                        coverage.kmCoverage >= 80 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(coverage.kmCoverage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {coverage.kmCoverage.toFixed(1)}% used
                  </p>
                </div>

                {/* Service Usage */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Services</span>
                    <span className="text-sm text-gray-500">
                      {warranty.services_used} / {warranty.max_services}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        coverage.serviceCoverage >= 100 ? "bg-red-500" :
                        coverage.serviceCoverage >= 80 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${coverage.serviceCoverage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {coverage.serviceCoverage.toFixed(1)}% used
                  </p>
                </div>

                {/* Time Coverage */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Time</span>
                    <span className="text-sm text-gray-500">
                      {calculatedStatus.daysUntilExpiry > 0 ? `${calculatedStatus.daysUntilExpiry} days left` : "Expired"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        coverage.timeCoverage >= 100 ? "bg-red-500" :
                        coverage.timeCoverage >= 80 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${coverage.timeCoverage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {coverage.timeCoverage.toFixed(1)}% elapsed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          {warranty.terms_conditions && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {warranty.terms_conditions}
                </p>
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
          
          {warranty.services && warranty.services.length > 0 ? (
            <div className="space-y-4">
              {warranty.services.map((service: any) => (
                <Card key={service.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Tool className="h-8 w-8 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{service.service_type_name}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(service.service_date).toLocaleDateString()} • {service.km_at_service.toLocaleString()} km
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${service.cost_covered.toFixed(2)}</p>
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
                <Tool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No services recorded under this warranty yet.</p>
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
          
          {warranty.claims && warranty.claims.length > 0 ? (
            <div className="space-y-4">
              {warranty.claims.map((claim: any) => (
                <Card key={claim.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-orange-500" />
                        <div>
                          <h4 className="font-medium">{claim.claim_type.replace(/\b\w/g, l => l.toUpperCase())}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(claim.claim_date).toLocaleDateString()} • {claim.description}
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
                          {claim.status.replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        {claim.estimated_cost && (
                          <p className="text-sm text-gray-500 mt-1">
                            Est: ${claim.estimated_cost.toFixed(2)}
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
            <h3 className="text-lg font-semibold">Documents</h3>
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
