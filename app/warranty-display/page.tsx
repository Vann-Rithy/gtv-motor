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
  warranty_battery_years: number
  warranty_battery_km: number
}

interface VehicleWarrantyDetails {
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
  warranty_components: Array<{
    component_name: string
    warranty_years: number
    warranty_km: number
    warranty_end_date: string
    status: string
    days_remaining: number
    km_remaining: number
  }>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.vehicle_id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{vehicle.plate_number}</CardTitle>
                {getStatusIcon(vehicle.warranty_status)}
              </div>
              <CardDescription>
                {vehicle.model_name} • {vehicle.year}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <p className="font-medium">{vehicle.customer_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="font-medium">{vehicle.customer_phone}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Warranty Status:</span>
                  <Badge className={getStatusBadgeColor(vehicle.warranty_status)}>
                    {vehicle.warranty_status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expires:</span>
                  <span className="font-medium">{formatDate(vehicle.warranty_end_date)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Days Remaining:</span>
                  <span className={`font-medium ${
                    vehicle.days_remaining > 30 ? 'text-green-600' : 
                    vehicle.days_remaining > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {vehicle.days_remaining > 0 ? `${vehicle.days_remaining} days` : 'Expired'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Mileage:</span>
                  <span className="font-medium">{vehicle.current_km?.toLocaleString() || 'N/A'} km</span>
                </div>
                <Progress 
                  value={vehicle.warranty_km_limit > 0 ? (vehicle.current_km / vehicle.warranty_km_limit) * 100 : 0} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 km</span>
                  <span>{vehicle.warranty_km_limit?.toLocaleString() || 'N/A'} km limit</span>
                </div>
              </div>

              <Button 
                onClick={() => fetchVehicleDetails(vehicle.vehicle_id)}
                className="w-full mt-4"
                variant="outline"
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicles.length === 0 && !loading && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No warranty data found</h3>
          <p className="text-gray-500">There are no vehicles with warranty information available.</p>
        </div>
      )}

      {selectedVehicle && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Warranty Details - {selectedVehicle.plate_number}</span>
              </DialogTitle>
              <DialogDescription>
                Complete warranty information for {selectedVehicle.model_name} ({selectedVehicle.year})
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <p className="font-medium">{selectedVehicle.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{selectedVehicle.customer_phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">VIN:</span>
                      <p className="font-medium">{selectedVehicle.vin_number}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Mileage:</span>
                      <p className="font-medium">{selectedVehicle.current_km?.toLocaleString() || 'N/A'} km</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Purchase Date:</span>
                      <p className="font-medium">{formatDate(selectedVehicle.purchase_date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Warranty Start:</span>
                      <p className="font-medium">{formatDate(selectedVehicle.warranty_start_date)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Warranty Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Days Left</TableHead>
                        <TableHead>KM Left</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedVehicle.warranty_components.map((component, index) => (
                        <TableRow key={index}>
                          <TableCell className="flex items-center space-x-2">
                            {getComponentIcon(component.component_name)}
                            <span>{component.component_name}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(component.status)}>
                              {component.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(component.warranty_end_date)}</TableCell>
                          <TableCell className={
                            component.days_remaining > 30 ? 'text-green-600' : 
                            component.days_remaining > 0 ? 'text-yellow-600' : 'text-red-600'
                          }>
                            {component.days_remaining > 0 ? `${component.days_remaining} days` : 'Expired'}
                          </TableCell>
                          <TableCell>
                            {component.km_remaining > 0 ? `${component.km_remaining.toLocaleString()} km` : 'N/A'}
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
