'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Wrench, Shield, CheckCircle, AlertCircle } from 'lucide-react'

interface Vehicle {
  id: number
  plate_number: string
  customer_name: string
  model_name: string
  warranty_start_date: string | null
  warranty_end_date: string | null
  current_km: number
}

interface ServiceType {
  id: number
  service_type_name: string
}

interface ServiceFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vehicleId?: number
}

export default function ServiceForm({ isOpen, onClose, onSuccess, vehicleId }: ServiceFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    vehicle_id: vehicleId || '',
    service_type_id: '',
    service_date: new Date().toISOString().split('T')[0],
    current_km: '',
    volume_l: '',
    total_amount: '',
    service_status: 'pending',
    warranty_used: false,
    set_warranty_start_date: false
  })

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchInitialData()
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === parseInt(formData.vehicle_id))
      setSelectedVehicle(vehicle || null)
    }
  }, [formData.vehicle_id, vehicles])

  const fetchInitialData = async () => {
    try {
      const [vehiclesResponse, serviceTypesResponse] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/service-types')
      ])

      if (!vehiclesResponse.ok || !serviceTypesResponse.ok) {
        throw new Error('Failed to fetch initial data')
      }

      const vehiclesData = await vehiclesResponse.json()
      const serviceTypesData = await serviceTypesResponse.json()

      setVehicles(vehiclesData.data)
      setServiceTypes(serviceTypesData.data)
    } catch (err) {
      setError('Failed to load form data')
      console.error('Error fetching initial data:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/services-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          vehicle_id: parseInt(formData.vehicle_id),
          service_type_id: formData.service_type_id ? parseInt(formData.service_type_id) : null,
          current_km: formData.current_km ? parseInt(formData.current_km) : null,
          volume_l: formData.volume_l ? parseFloat(formData.volume_l) : null,
          total_amount: parseFloat(formData.total_amount) || 0,
          warranty_used: formData.warranty_used,
          set_warranty_start_date: formData.set_warranty_start_date
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create service')
      }

      setSuccess('Service created successfully!')
      onSuccess()
      
      // Reset form
      setFormData({
        vehicle_id: vehicleId || '',
        service_type_id: '',
        service_date: new Date().toISOString().split('T')[0],
        current_km: '',
        volume_l: '',
        total_amount: '',
        service_status: 'pending',
        warranty_used: false,
        set_warranty_start_date: false
      })
      setSelectedVehicle(null)

      // Close dialog after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (err) {
      setError('Failed to create service')
      console.error('Error creating service:', err)
    } finally {
      setLoading(false)
    }
  }

  const isFirstService = selectedVehicle && !selectedVehicle.warranty_start_date

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wrench className="h-6 w-6 text-blue-600" />
            <span>Create Service Record</span>
          </DialogTitle>
          <DialogDescription>
            Add a new service record for the vehicle
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label htmlFor="vehicle_id">Vehicle *</Label>
            <Select
              value={formData.vehicle_id.toString()}
              onValueChange={(value) => setFormData({...formData, vehicle_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                    {vehicle.plate_number} - {vehicle.customer_name} ({vehicle.model_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="service_type_id">Service Type</Label>
            <Select
              value={formData.service_type_id}
              onValueChange={(value) => setFormData({...formData, service_type_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.service_type_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Date */}
          <div className="space-y-2">
            <Label htmlFor="service_date">Service Date *</Label>
            <Input
              id="service_date"
              type="date"
              value={formData.service_date}
              onChange={(e) => setFormData({...formData, service_date: e.target.value})}
              required
            />
          </div>

          {/* Current KM at Service */}
          <div className="space-y-2">
            <Label htmlFor="current_km">Current KM at Service</Label>
            <Input
              id="current_km"
              type="number"
              value={formData.current_km}
              onChange={(e) => setFormData({...formData, current_km: e.target.value})}
              placeholder="Enter current kilometer reading"
            />
          </div>

          {/* Volume (L) */}
          <div className="space-y-2">
            <Label htmlFor="volume_l">Volume (L)</Label>
            <Input
              id="volume_l"
              type="number"
              step="0.1"
              value={formData.volume_l}
              onChange={(e) => setFormData({...formData, volume_l: e.target.value})}
              placeholder="Enter engine volume in liters"
            />
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="total_amount">Total Amount</Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              value={formData.total_amount}
              onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
              placeholder="0.00"
            />
          </div>

          {/* Service Status */}
          <div className="space-y-2">
            <Label htmlFor="service_status">Service Status</Label>
            <Select
              value={formData.service_status}
              onValueChange={(value) => setFormData({...formData, service_status: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warranty Options */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Warranty Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="warranty_used"
                  checked={formData.warranty_used}
                  onCheckedChange={(checked) => setFormData({...formData, warranty_used: checked as boolean})}
                />
                <Label htmlFor="warranty_used">This service was covered under warranty</Label>
              </div>

              {isFirstService && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">First Service Detected</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    This appears to be the first service for this vehicle. You can set this as the warranty start date.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="set_warranty_start_date"
                      checked={formData.set_warranty_start_date}
                      onCheckedChange={(checked) => setFormData({...formData, set_warranty_start_date: checked as boolean})}
                    />
                    <Label htmlFor="set_warranty_start_date">
                      Set warranty start date to service date ({formData.service_date})
                    </Label>
                  </div>
                </div>
              )}

              {selectedVehicle && selectedVehicle.warranty_start_date && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Warranty Information</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>Warranty Start: {new Date(selectedVehicle.warranty_start_date).toLocaleDateString()}</div>
                    <div>Warranty End: {selectedVehicle.warranty_end_date ? new Date(selectedVehicle.warranty_end_date).toLocaleDateString() : 'N/A'}</div>
                    <div>Current KM: {selectedVehicle.current_km?.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
