'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Car, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export default function WarrantyDisplayPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
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
      setVehicles(data.data || [])
    } catch (err) {
      setError('Failed to load warranty status data')
      console.error('Error fetching warranty status:', err)
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
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
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
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
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
                    {vehicle.warranty_status?.replace('_', ' ') || 'Unknown'}
                  </Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expires:</span>
                  <span className="font-medium">{vehicle.warranty_end_date ? formatDate(vehicle.warranty_end_date) : 'N/A'}</span>
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
              </div>

              <Button 
                onClick={() => console.log('View details for vehicle:', vehicle.vehicle_id)}
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
    </div>
  )
}
