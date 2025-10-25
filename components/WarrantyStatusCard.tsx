'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Cog,
  Paintbrush,
  Wrench,
  Zap,
  Battery,
  Calendar,
  Gauge
} from 'lucide-react'

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

interface VehicleWarrantyInfo {
  vehicle_id: number
  plate_number: string
  warranty_start_date: string
  warranty_end_date: string
  current_km: number
  customer_name: string
  model_name: string
}

interface WarrantyStatusCardProps {
  vehicleId: number
  compact?: boolean
  showDetails?: boolean
}

export default function WarrantyStatusCard({ 
  vehicleId, 
  compact = false, 
  showDetails = true 
}: WarrantyStatusCardProps) {
  const [warrantyData, setWarrantyData] = useState<{
    vehicle_info: VehicleWarrantyInfo
    warranty_status: Record<string, WarrantyComponentStatus>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWarrantyData()
  }, [vehicleId])

  const fetchWarrantyData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warranty-status/vehicle/${vehicleId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch warranty data')
      }
      const data = await response.json()
      setWarrantyData(data.data)
    } catch (err) {
      setError('Failed to load warranty data')
      console.error('Error fetching warranty data:', err)
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
        return <Cog className="h-4 w-4 text-blue-600" />
      case 'Car Paint':
        return <Paintbrush className="h-4 w-4 text-purple-600" />
      case 'Transmission (gearbox)':
        return <Wrench className="h-4 w-4 text-orange-600" />
      case 'Electrical System':
        return <Zap className="h-4 w-4 text-yellow-600" />
      case 'Battery Hybrid':
        return <Battery className="h-4 w-4 text-green-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
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
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !warrantyData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load warranty data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { vehicle_info, warranty_status } = warrantyData

  if (compact) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Warranty Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Vehicle:</span>
              <span className="text-sm">{vehicle_info.plate_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Start Date:</span>
              <span className="text-sm">{formatDate(vehicle_info.warranty_start_date)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current KM:</span>
              <span className="text-sm font-semibold">{vehicle_info.current_km?.toLocaleString()}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(warranty_status).map(([component, status]) => (
                <div key={component} className="flex items-center space-x-2">
                  {getComponentIcon(component)}
                  <div className="flex-1">
                    <div className="text-xs font-medium">{component}</div>
                    <Badge 
                      className={`text-xs ${getStatusBadgeColor(status.status)}`}
                    >
                      {status.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <span>Warranty Status</span>
        </CardTitle>
        <CardDescription>
          {vehicle_info.model_name} - {vehicle_info.customer_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vehicle Info Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-600">Plate Number</div>
            <div className="text-lg font-semibold">{vehicle_info.plate_number}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Start Date</div>
            <div className="text-lg">{formatDate(vehicle_info.warranty_start_date)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Current KM</div>
            <div className="text-lg font-semibold">{vehicle_info.current_km?.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Model</div>
            <div className="text-lg">{vehicle_info.model_name}</div>
          </div>
        </div>

        {/* Warranty Components */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Component Warranty Status</h4>
          {Object.entries(warranty_status).map(([component, status]) => (
            <Card key={component} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getComponentIcon(component)}
                    <div>
                      <h5 className="font-semibold">{component}</h5>
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
                    <div className="text-sm font-medium text-gray-600">Original Warranty</div>
                    <div className="text-sm">{status.original_warranty}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Remaining</div>
                    <div className="text-sm font-semibold">{status.remaining_display}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Expiry Date</div>
                    <div className="text-sm">
                      {status.expiry_date ? formatDate(status.expiry_date) : 'N/A'}
                      {status.expiry_date && !status.is_expired && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({calculateDaysRemaining(status.expiry_date)} days left)
                        </span>
                      )}
                    </div>
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

        {/* Quick Actions */}
        {showDetails && (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View Service History
            </Button>
            <Button variant="outline" size="sm">
              <Gauge className="h-4 w-4 mr-2" />
              Full Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
