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
import { Calendar, Wrench, Shield, CheckCircle, AlertCircle, Car } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api-config'

interface Vehicle {
  id: number
  plate_number: string
  customer_name: string
  model_name: string
  warranty_start_date: string | null
  warranty_end_date: string | null
  current_km: number
  vehicle_model_id: number
}

interface WarrantyComponent {
  id: number
  name: string
  description: string
  category: string
  warranty_years: number
  warranty_kilometers: number
  is_applicable: number
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
  const [warrantyComponents, setWarrantyComponents] = useState<WarrantyComponent[]>([])
  const [selectedWarrantyParts, setSelectedWarrantyParts] = useState<Record<number, boolean>>({})
  const [warrantyDurations, setWarrantyDurations] = useState<Record<number, {years: number, kilometers: number}>>({})

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
      
      // Fetch warranty components when vehicle is selected
      if (vehicle) {
        console.log('Vehicle selected:', vehicle)
        console.log('Vehicle model ID:', vehicle.vehicle_model_id)
        fetchWarrantyComponents(vehicle.vehicle_model_id)
      } else {
        // If no vehicle found or no model ID, still fetch with undefined to get fallback
        fetchWarrantyComponents()
      }
    }
  }, [formData.vehicle_id, vehicles])

  const fetchWarrantyComponents = async (modelId?: number) => {
    try {
      if (!modelId) {
        console.log('No model ID provided, using fallback warranty components')
        // Use fallback warranty components
        const fallbackComponents: WarrantyComponent[] = [
          { id: 1, name: 'Engine', description: 'Engine warranty coverage', category: 'Engine', warranty_years: 10, warranty_kilometers: 200000, is_applicable: 1 },
          { id: 2, name: 'Car Paint', description: 'Paint and body warranty coverage', category: 'Body', warranty_years: 10, warranty_kilometers: 200000, is_applicable: 1 },
          { id: 3, name: 'Transmission (gearbox)', description: 'Transmission and gearbox warranty coverage', category: 'Transmission', warranty_years: 5, warranty_kilometers: 100000, is_applicable: 1 },
          { id: 4, name: 'Electrical System', description: 'Electrical components warranty coverage', category: 'Electrical', warranty_years: 5, warranty_kilometers: 100000, is_applicable: 1 },
          { id: 5, name: 'Battery Hybrid', description: 'Hybrid battery warranty coverage', category: 'Battery', warranty_years: 8, warranty_kilometers: 150000, is_applicable: 0 }
        ]
        setWarrantyComponents(fallbackComponents)
        
        const selectedParts: Record<number, boolean> = {}
        fallbackComponents.forEach((component) => {
          if (component.is_applicable) {
            selectedParts[component.id] = true
          }
        })
        setSelectedWarrantyParts(selectedParts)
        return
      }
      
      console.log('Fetching warranty components for model ID:', modelId)
      const response = await fetch(`/api/warranty-parts?vehicle_model_id=${modelId}`)
      const data = await response.json()
      
      console.log('Warranty components response:', data)
      
      if (data.success && data.data) {
        setWarrantyComponents(data.data)
        
        // Pre-select all applicable components
        const selectedParts: Record<number, boolean> = {}
        data.data.forEach((component: WarrantyComponent) => {
          if (component.is_applicable) {
            selectedParts[component.id] = true
          }
        })
        setSelectedWarrantyParts(selectedParts)
      } else {
        // Use fallback if API fails
        console.log('API response not successful, using fallback')
        const fallbackComponents: WarrantyComponent[] = [
          { id: 1, name: 'Engine', description: 'Engine warranty coverage', category: 'Engine', warranty_years: 10, warranty_kilometers: 200000, is_applicable: 1 },
          { id: 2, name: 'Car Paint', description: 'Paint and body warranty coverage', category: 'Body', warranty_years: 10, warranty_kilometers: 200000, is_applicable: 1 },
          { id: 3, name: 'Transmission (gearbox)', description: 'Transmission and gearbox warranty coverage', category: 'Transmission', warranty_years: 5, warranty_kilometers: 100000, is_applicable: 1 },
          { id: 4, name: 'Electrical System', description: 'Electrical components warranty coverage', category: 'Electrical', warranty_years: 5, warranty_kilometers: 100000, is_applicable: 1 },
          { id: 5, name: 'Battery Hybrid', description: 'Hybrid battery warranty coverage', category: 'Battery', warranty_years: 8, warranty_kilometers: 150000, is_applicable: 0 }
        ]
        setWarrantyComponents(fallbackComponents)
        
        const selectedParts: Record<number, boolean> = {}
        fallbackComponents.forEach((component) => {
          if (component.is_applicable) {
            selectedParts[component.id] = true
          }
        })
        setSelectedWarrantyParts(selectedParts)
      }
    } catch (err) {
      console.error('Error fetching warranty components:', err)
      // Use fallback on error
      const fallbackComponents: WarrantyComponent[] = [
        { id: 1, name: 'Engine', description: 'Engine warranty coverage', category: 'Engine', warranty_years: 10, warranty_kilometers: 200000, is_applicable: 1 },
        { id: 2, name: 'Car Paint', description: 'Paint and body warranty coverage', category: 'Body', warranty_years: 10, warranty_kilometers: 200000, is_applicable: 1 },
        { id: 3, name: 'Transmission (gearbox)', description: 'Transmission and gearbox warranty coverage', category: 'Transmission', warranty_years: 5, warranty_kilometers: 100000, is_applicable: 1 },
        { id: 4, name: 'Electrical System', description: 'Electrical components warranty coverage', category: 'Electrical', warranty_years: 5, warranty_kilometers: 100000, is_applicable: 1 },
        { id: 5, name: 'Battery Hybrid', description: 'Hybrid battery warranty coverage', category: 'Battery', warranty_years: 8, warranty_kilometers: 150000, is_applicable: 0 }
      ]
      setWarrantyComponents(fallbackComponents)
      
      const selectedParts: Record<number, boolean> = {}
      fallbackComponents.forEach((component) => {
        if (component.is_applicable) {
          selectedParts[component.id] = true
        }
      })
      setSelectedWarrantyParts(selectedParts)
    }
  }

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

      // Prepare warranty parts data if warranty start date is being set
      const warrantyPartsPayload = formData.set_warranty_start_date && selectedWarrantyParts
        ? Object.entries(selectedWarrantyParts)
            .filter(([_, selected]) => selected)
            .map(([componentId, _]) => {
              const componentIdNum = parseInt(componentId)
              const component = warrantyComponents.find(c => c.id === componentIdNum)
              const duration = warrantyDurations[componentIdNum]
              
              return {
                warranty_component_id: componentIdNum,
                warranty_years: duration?.years || component?.warranty_years || 0,
                warranty_kilometers: duration?.kilometers || component?.warranty_kilometers || 0
              }
            })
        : []

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
          set_warranty_start_date: formData.set_warranty_start_date,
          warranty_parts: warrantyPartsPayload
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create service')
      }

      // If warranty start date is being set, also save warranty parts to vehicle_warranty_parts table
      if (formData.set_warranty_start_date && warrantyPartsPayload.length > 0) {
        const warrantyPartsResponse = await fetch(`${API_BASE_URL}/api/vehicle_warranty_parts.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_id: parseInt(formData.vehicle_id),
            start_date: formData.service_date,
            warranty_parts: warrantyPartsPayload
          })
        })

        if (!warrantyPartsResponse.ok) {
          console.warn('Warning: Service created but warranty parts failed to save')
        }
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
      setSelectedWarrantyParts({})
      setWarrantyDurations({})

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

          {/* Vehicle Information */}
          {selectedVehicle && (
            <Card className="border-gray-200 bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Car className="h-5 w-5 text-gray-600" />
                  <span>Vehicle Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Plate Number:</span>
                    <p className="font-medium">{selectedVehicle.plate_number}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Model:</span>
                    <p className="font-medium">{selectedVehicle.model_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <p className="font-medium">{selectedVehicle.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Current KM:</span>
                    <p className="font-medium">{selectedVehicle.current_km?.toLocaleString() || 'N/A'}</p>
                  </div>
                  {selectedVehicle.warranty_start_date && (
                    <div>
                      <span className="text-gray-500">Warranty Status:</span>
                      <p className="font-medium text-green-600">Active</p>
                    </div>
                  )}
                  {selectedVehicle.warranty_start_date && (
                    <div>
                      <span className="text-gray-500">Warranty Start:</span>
                      <p className="font-medium">{new Date(selectedVehicle.warranty_start_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
          {selectedVehicle && (
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

                {/* Warranty Parts Section - Always Visible */}
                {isFirstService && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">Set Warranty Start Date</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      This appears to be the first service for this vehicle. You can set this as the warranty start date and select warranty parts.
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
                    
                    {/* Warranty Parts Selection */}
                    {formData.set_warranty_start_date && (
                      <div className="mt-4 space-y-3">
                        <Label className="font-semibold">Select Warranty Parts and Set Duration:</Label>
                        {warrantyComponents.length === 0 ? (
                          <div className="text-sm text-yellow-600 p-2">
                            Loading warranty components...
                          </div>
                        ) : (
                          <div className="space-y-3 mt-2">
                          {warrantyComponents.filter(c => c.is_applicable).map((component) => (
                          <div
                            key={component.id}
                            className="p-4 border rounded-lg hover:bg-gray-50 space-y-3"
                          >
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                checked={selectedWarrantyParts[component.id] || false}
                                onCheckedChange={(checked) => {
                                  setSelectedWarrantyParts({
                                    ...selectedWarrantyParts,
                                    [component.id]: checked as boolean
                                  })
                                  // Initialize durations when selected
                                  if (checked && !warrantyDurations[component.id]) {
                                    setWarrantyDurations({
                                      ...warrantyDurations,
                                      [component.id]: {
                                        years: component.warranty_years,
                                        kilometers: component.warranty_kilometers
                                      }
                                    })
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{component.name}</div>
                                <div className="text-xs text-gray-500">{component.description}</div>
                              </div>
                            </div>
                            
                            {/* Duration Input Fields */}
                            {selectedWarrantyParts[component.id] && (
                              <div className="grid grid-cols-2 gap-3 ml-6 mt-2">
                                <div className="space-y-1">
                                  <Label htmlFor={`years-${component.id}`} className="text-xs">
                                    Warranty Years
                                  </Label>
                                  <Input
                                    id={`years-${component.id}`}
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={warrantyDurations[component.id]?.years || component.warranty_years}
                                    onChange={(e) => {
                                      const years = parseInt(e.target.value) || component.warranty_years
                                      setWarrantyDurations({
                                        ...warrantyDurations,
                                        [component.id]: {
                                          years,
                                          kilometers: warrantyDurations[component.id]?.kilometers || component.warranty_kilometers
                                        }
                                      })
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`km-${component.id}`} className="text-xs">
                                    Warranty Kilometers
                                  </Label>
                                  <Input
                                    id={`km-${component.id}`}
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={warrantyDurations[component.id]?.kilometers || component.warranty_kilometers}
                                    onChange={(e) => {
                                      const kilometers = parseInt(e.target.value) || component.warranty_kilometers
                                      setWarrantyDurations({
                                        ...warrantyDurations,
                                        [component.id]: {
                                          years: warrantyDurations[component.id]?.years || component.warranty_years,
                                          kilometers
                                        }
                                      })
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                            
                            {/* Default Duration Display (when not selected) */}
                            {!selectedWarrantyParts[component.id] && (
                              <div className="text-xs text-gray-500 ml-6">
                                Default: {component.warranty_years} Years / {component.warranty_kilometers.toLocaleString()} km
                              </div>
                            )}
                          </div>
                        ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
