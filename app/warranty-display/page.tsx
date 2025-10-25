'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Car, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Gauge,
  Wrench,
  Battery,
  Zap,
  Paintbrush,
  Cog
} from 'lucide-react'

interface VehicleWarrantyInfo {
  vehicle_id: number
  plate_number: string
  vin_number: string
  year: number
  purchase_date: string
  warranty_start_date: string
  warranty_end_date: string
  warranty_km_limit: number
  warranty_service_count: number
  warranty_max_services: number
  current_km: number
  customer_name: string
  customer_phone: string
  model_name: string
  model_category: string
  warranty_engine_years: number
  warranty_engine_km: number
  warranty_paint_years: number
  warranty_paint_km: number
  warranty_transmission_years: number
  warranty_transmission_km: number
  warranty_electrical_years: number
  warranty_electrical_km: number
  warranty_battery_years: number | null
  warranty_battery_km: number | null
  has_hybrid_battery: boolean
}

interface WarrantyComponentStatus {
  component: string
  status: 'active' | 'expiring_soon' | 'expired' | 'not_applicable'
  message: string
  remaining_years: number
  remaining_km: number
  expiry_date: string | null
  is_expired: boolean
  progress_percentage: number
  original_warranty: string
  remaining_display: string
}

interface ServiceHistory {
  id: number
  service_date: string
  total_amount: number
  service_status: string
  current_km_at_service: number
  warranty_used: boolean
  service_type_name: string
}

interface VehicleWarrantyDetails {
  vehicle_info: VehicleWarrantyInfo
  warranty_status: Record<string, WarrantyComponentStatus>
  service_history: ServiceHistory[]
}

export default function WarrantyDisplayPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWarrantyDetails | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWarrantyStatus()
  }, [])

  const fetchWarrantyStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/warranty-status/status')
      if (!response.ok) {
        throw new Error('Failed to fetch warranty status')
      }
      const data = await response.json()
      setVehicles(data.data)
    } catch (err) {
      setError('Failed to load warranty status data')
      console.error('Error fetching warranty status:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicleDetails = async (vehicleId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warranty-status/vehicle/${vehicleId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle details')
      }
      const data = await response.json()
      setSelectedVehicle(data.data)
      setIsDetailDialogOpen(true)
    } catch (err) {
      setError('Failed to load vehicle warranty details')
      console.error('Error fetching vehicle details:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'expiring_soon':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'not_applicable':
        return <XCircle className="h-4 w-4 text-gray-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expiring_soon':
        return 'bg-yellow-100 text-yellow-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'not_applicable':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'Engine':
        return <Cog className="h-5 w-5 text-blue-600" />
      case 'Car Paint':
        return <Paintbrush className="h-5 w-5 text-purple-600" />
      case 'Transmission (gearbox)':
        return <Wrench className="h-5 w-5 text-orange-600" />
      case 'Electrical System':
        return <Zap className="h-5 w-5 text-yellow-600" />
      case 'Battery Hybrid':
        return <Battery className="h-5 w-5 text-green-600" />
      default:
        return <Shield className="h-5 w-5 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateDaysRemaining = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warranty Status Display</h1>
          <p className="text-gray-600 mt-2">Real-time warranty status for all vehicles</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <Car className="h-8 w-8 text-gray-600" />
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Warranty Status</CardTitle>
          <CardDescription>Click "View Details" to see component-specific warranty information</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Warranty Start</TableHead>
                <TableHead>Current KM</TableHead>
                <TableHead>Engine Status</TableHead>
                <TableHead>Paint Status</TableHead>
                <TableHead>Transmission Status</TableHead>
                <TableHead>Electrical Status</TableHead>
                <TableHead>Battery Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.vehicle_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{vehicle.plate_number}</div>
                      <div className="text-sm text-gray-500">{vehicle.year}</div>
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.customer_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{vehicle.model_name}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(vehicle.warranty_start_date)}</TableCell>
                  <TableCell>{vehicle.current_km?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(vehicle.warranty_status?.Engine?.status)}
                      <Badge className={getStatusBadgeColor(vehicle.warranty_status?.Engine?.status)}>
                        {vehicle.warranty_status?.Engine?.status || 'N/A'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(vehicle.warranty_status?.'Car Paint'?.status)}
                      <Badge className={getStatusBadgeColor(vehicle.warranty_status?.'Car Paint'?.status)}>
                        {vehicle.warranty_status?.'Car Paint'?.status || 'N/A'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(vehicle.warranty_status?.'Transmission (gearbox)'?.status)}
                      <Badge className={getStatusBadgeColor(vehicle.warranty_status?.'Transmission (gearbox)'?.status)}>
                        {vehicle.warranty_status?.'Transmission (gearbox)'?.status || 'N/A'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(vehicle.warranty_status?.'Electrical System'?.status)}
                      <Badge className={getStatusBadgeColor(vehicle.warranty_status?.'Electrical System'?.status)}>
                        {vehicle.warranty_status?.'Electrical System'?.status || 'N/A'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(vehicle.warranty_status?.'Battery Hybrid'?.status)}
                      <Badge className={getStatusBadgeColor(vehicle.warranty_status?.'Battery Hybrid'?.status)}>
                        {vehicle.warranty_status?.'Battery Hybrid'?.status || 'N/A'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchVehicleDetails(vehicle.vehicle_id)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vehicle Warranty Details Dialog */}
      {selectedVehicle && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Warranty Details - {selectedVehicle.vehicle_info.plate_number}
              </DialogTitle>
              <DialogDescription>
                {selectedVehicle.vehicle_info.model_name} - {selectedVehicle.vehicle_info.customer_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="h-5 w-5" />
                    <span>Vehicle Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Plate Number</Label>
                      <p className="text-lg font-semibold">{selectedVehicle.vehicle_info.plate_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">VIN Number</Label>
                      <p className="text-lg">{selectedVehicle.vehicle_info.vin_number || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Year</Label>
                      <p className="text-lg">{selectedVehicle.vehicle_info.year || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Current KM</Label>
                      <p className="text-lg font-semibold">{selectedVehicle.vehicle_info.current_km?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Warranty Start Date</Label>
                      <p className="text-lg">{formatDate(selectedVehicle.vehicle_info.warranty_start_date)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Purchase Date</Label>
                      <p className="text-lg">{formatDate(selectedVehicle.vehicle_info.purchase_date)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Customer</Label>
                      <p className="text-lg">{selectedVehicle.vehicle_info.customer_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-lg">{selectedVehicle.vehicle_info.customer_phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warranty Components */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Warranty Components Status</span>
                  </CardTitle>
                  <CardDescription>
                    Component-specific warranty status based on start date and current usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(selectedVehicle.warranty_status).map(([component, status]) => (
                      <Card key={component} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {getComponentIcon(component)}
                              <div>
                                <h4 className="font-semibold text-lg">{component}</h4>
                                <p className="text-sm text-gray-600">{status.message}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(status.status)}
                              <Badge className={getStatusBadgeColor(status.status)}>
                                {status.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <Label className="text-sm font-medium">Original Warranty</Label>
                              <p className="text-sm">{status.original_warranty}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Remaining</Label>
                              <p className="text-sm font-semibold">{status.remaining_display}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Expiry Date</Label>
                              <p className="text-sm">
                                {status.expiry_date ? formatDate(status.expiry_date) : 'N/A'}
                                {status.expiry_date && !status.is_expired && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({calculateDaysRemaining(status.expiry_date)} days left)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Warranty Progress</span>
                              <span>{status.progress_percentage}%</span>
                            </div>
                            <Progress 
                              value={status.progress_percentage} 
                              className="h-2"
                              style={{
                                backgroundColor: status.is_expired ? '#ef4444' : 
                                               status.status === 'expiring_soon' ? '#f59e0b' : '#10b981'
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Service History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wrench className="h-5 w-5" />
                    <span>Service History</span>
                  </CardTitle>
                  <CardDescription>
                    Service records affecting warranty status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Date</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>KM at Service</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Warranty Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedVehicle.service_history.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>{formatDate(service.service_date)}</TableCell>
                          <TableCell>{service.service_type_name || 'N/A'}</TableCell>
                          <TableCell>{service.current_km_at_service?.toLocaleString() || 'N/A'}</TableCell>
                          <TableCell>${service.total_amount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Badge variant={service.service_status === 'completed' ? 'default' : 'secondary'}>
                              {service.service_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={service.warranty_used ? 'default' : 'outline'}>
                              {service.warranty_used ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
