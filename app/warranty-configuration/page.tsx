'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Edit, Settings, Car, Shield, Clock, AlertCircle } from 'lucide-react'

interface WarrantyComponent {
  id: number
  name: string
  description: string
  category: string
  is_active: boolean
}

interface VehicleModelWarranty {
  id: number
  name: string
  category: string
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

interface WarrantyConfiguration {
  component: string
  years: number
  kilometers: number
  is_applicable: boolean
  display_text: string
}

interface ModelWarrantyDetails {
  id: number
  name: string
  description: string
  category: string
  has_hybrid_battery: boolean
  warranties: WarrantyConfiguration[]
}

export default function WarrantyConfigurationPage() {
  const [vehicleModels, setVehicleModels] = useState<VehicleModelWarranty[]>([])
  const [warrantyComponents, setWarrantyComponents] = useState<WarrantyComponent[]>([])
  const [selectedModel, setSelectedModel] = useState<ModelWarrantyDetails | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<VehicleModelWarranty | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state for editing
  const [formData, setFormData] = useState({
    warranty_engine_years: 10,
    warranty_engine_km: 200000,
    warranty_paint_years: 10,
    warranty_paint_km: 200000,
    warranty_transmission_years: 5,
    warranty_transmission_km: 100000,
    warranty_electrical_years: 5,
    warranty_electrical_km: 100000,
    warranty_battery_years: 0,
    warranty_battery_km: 0,
    has_hybrid_battery: false
  })

  useEffect(() => {
    fetchWarrantyData()
  }, [])

  const fetchWarrantyData = async () => {
    try {
      setLoading(true)
      const [modelsResponse, componentsResponse] = await Promise.all([
        fetch('/api/warranty-configuration'),
        fetch('/api/warranty-configuration/components')
      ])

      if (!modelsResponse.ok || !componentsResponse.ok) {
        throw new Error('Failed to fetch warranty data')
      }

      const modelsData = await modelsResponse.json()
      const componentsData = await componentsResponse.json()

      setVehicleModels(modelsData.data)
      setWarrantyComponents(componentsData.data)
    } catch (err) {
      setError('Failed to load warranty configuration data')
      console.error('Error fetching warranty data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchModelDetails = async (modelId: number) => {
    try {
      const response = await fetch(`/api/warranty-configuration/model/${modelId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch model details')
      }
      const data = await response.json()
      setSelectedModel(data.data)
    } catch (err) {
      setError('Failed to load model warranty details')
      console.error('Error fetching model details:', err)
    }
  }

  const handleEditModel = (model: VehicleModelWarranty) => {
    setEditingModel(model)
    setFormData({
      warranty_engine_years: model.warranty_engine_years,
      warranty_engine_km: model.warranty_engine_km,
      warranty_paint_years: model.warranty_paint_years,
      warranty_paint_km: model.warranty_paint_km,
      warranty_transmission_years: model.warranty_transmission_years,
      warranty_transmission_km: model.warranty_transmission_km,
      warranty_electrical_years: model.warranty_electrical_years,
      warranty_electrical_km: model.warranty_electrical_km,
      warranty_battery_years: model.warranty_battery_years || 0,
      warranty_battery_km: model.warranty_battery_km || 0,
      has_hybrid_battery: model.has_hybrid_battery
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveWarrantyConfiguration = async () => {
    if (!editingModel) return

    try {
      setLoading(true)
      const response = await fetch(`/api/warranty-configuration/update-model/${editingModel.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to update warranty configuration')
      }

      setSuccess('Warranty configuration updated successfully')
      setIsEditDialogOpen(false)
      fetchWarrantyData()
    } catch (err) {
      setError('Failed to update warranty configuration')
      console.error('Error updating warranty:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatWarrantyDisplay = (years: number, kilometers: number) => {
    return `${years} Years / ${kilometers.toLocaleString()} km`
  }

  const getWarrantyBadgeColor = (years: number) => {
    if (years >= 10) return 'bg-green-100 text-green-800'
    if (years >= 5) return 'bg-blue-100 text-blue-800'
    return 'bg-yellow-100 text-yellow-800'
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
          <h1 className="text-3xl font-bold text-gray-900">Warranty Configuration</h1>
          <p className="text-gray-600 mt-2">Manage warranty settings for vehicle models</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <Settings className="h-8 w-8 text-gray-600" />
        </div>
      </div>

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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Vehicle Models</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Models</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vehicleModels.length}</div>
                <p className="text-xs text-muted-foreground">Vehicle models configured</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warranty Components</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{warrantyComponents.length}</div>
                <p className="text-xs text-muted-foreground">Components covered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hybrid Models</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {vehicleModels.filter(m => m.has_hybrid_battery).length}
                </div>
                <p className="text-xs text-muted-foreground">With battery warranty</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Warranty Summary</CardTitle>
              <CardDescription>Overview of warranty configurations for all vehicle models</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Engine</TableHead>
                    <TableHead>Paint</TableHead>
                    <TableHead>Transmission</TableHead>
                    <TableHead>Electrical</TableHead>
                    <TableHead>Battery</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{model.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getWarrantyBadgeColor(model.warranty_engine_years)}>
                          {formatWarrantyDisplay(model.warranty_engine_years, model.warranty_engine_km)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getWarrantyBadgeColor(model.warranty_paint_years)}>
                          {formatWarrantyDisplay(model.warranty_paint_years, model.warranty_paint_km)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getWarrantyBadgeColor(model.warranty_transmission_years)}>
                          {formatWarrantyDisplay(model.warranty_transmission_years, model.warranty_transmission_km)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getWarrantyBadgeColor(model.warranty_electrical_years)}>
                          {formatWarrantyDisplay(model.warranty_electrical_years, model.warranty_electrical_km)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {model.has_hybrid_battery && model.warranty_battery_years ? (
                          <Badge className={getWarrantyBadgeColor(model.warranty_battery_years)}>
                            {formatWarrantyDisplay(model.warranty_battery_years, model.warranty_battery_km || 0)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchModelDetails(model.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditModel(model)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Models Warranty Configuration</CardTitle>
              <CardDescription>Detailed warranty settings for each vehicle model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicleModels.map((model) => (
                  <Card key={model.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <Badge variant="outline">{model.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Engine:</span>
                          <Badge className={getWarrantyBadgeColor(model.warranty_engine_years)}>
                            {model.warranty_engine_years}y
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Paint:</span>
                          <Badge className={getWarrantyBadgeColor(model.warranty_paint_years)}>
                            {model.warranty_paint_years}y
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Transmission:</span>
                          <Badge className={getWarrantyBadgeColor(model.warranty_transmission_years)}>
                            {model.warranty_transmission_years}y
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Electrical:</span>
                          <Badge className={getWarrantyBadgeColor(model.warranty_electrical_years)}>
                            {model.warranty_electrical_years}y
                          </Badge>
                        </div>
                        {model.has_hybrid_battery && (
                          <div className="flex justify-between text-sm">
                            <span>Battery:</span>
                            <Badge className={getWarrantyBadgeColor(model.warranty_battery_years || 0)}>
                              {model.warranty_battery_years}y
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => fetchModelDetails(model.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditModel(model)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Warranty Components</CardTitle>
              <CardDescription>Components covered under warranty</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {warrantyComponents.map((component) => (
                  <Card key={component.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{component.name}</CardTitle>
                        <Badge variant="outline">{component.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{component.description}</p>
                      <div className="mt-3">
                        <Badge 
                          variant={component.is_active ? "default" : "secondary"}
                          className={component.is_active ? "bg-green-100 text-green-800" : ""}
                        >
                          {component.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Model Details Dialog */}
      {selectedModel && (
        <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedModel.name} - Warranty Details</DialogTitle>
              <DialogDescription>
                Detailed warranty configuration for {selectedModel.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Model Name</Label>
                  <Input value={selectedModel.name} disabled />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={selectedModel.category} disabled />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input value={selectedModel.description} disabled />
              </div>
              <div>
                <Label>Hybrid Battery</Label>
                <Badge variant={selectedModel.has_hybrid_battery ? "default" : "secondary"}>
                  {selectedModel.has_hybrid_battery ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <Label className="text-lg font-semibold">Warranty Components</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {selectedModel.warranties.map((warranty, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{warranty.component}</h4>
                            <p className="text-sm text-gray-600">{warranty.display_text}</p>
                          </div>
                          <Badge 
                            variant={warranty.is_applicable ? "default" : "secondary"}
                            className={warranty.is_applicable ? "bg-blue-100 text-blue-800" : ""}
                          >
                            {warranty.is_applicable ? "Applicable" : "N/A"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Warranty Configuration Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Warranty Configuration</DialogTitle>
            <DialogDescription>
              Update warranty settings for {editingModel?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="engine_years">Engine Warranty (Years)</Label>
                <Input
                  id="engine_years"
                  type="number"
                  value={formData.warranty_engine_years}
                  onChange={(e) => setFormData({...formData, warranty_engine_years: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="engine_km">Engine Warranty (KM)</Label>
                <Input
                  id="engine_km"
                  type="number"
                  value={formData.warranty_engine_km}
                  onChange={(e) => setFormData({...formData, warranty_engine_km: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paint_years">Paint Warranty (Years)</Label>
                <Input
                  id="paint_years"
                  type="number"
                  value={formData.warranty_paint_years}
                  onChange={(e) => setFormData({...formData, warranty_paint_years: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="paint_km">Paint Warranty (KM)</Label>
                <Input
                  id="paint_km"
                  type="number"
                  value={formData.warranty_paint_km}
                  onChange={(e) => setFormData({...formData, warranty_paint_km: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transmission_years">Transmission Warranty (Years)</Label>
                <Input
                  id="transmission_years"
                  type="number"
                  value={formData.warranty_transmission_years}
                  onChange={(e) => setFormData({...formData, warranty_transmission_years: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="transmission_km">Transmission Warranty (KM)</Label>
                <Input
                  id="transmission_km"
                  type="number"
                  value={formData.warranty_transmission_km}
                  onChange={(e) => setFormData({...formData, warranty_transmission_km: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="electrical_years">Electrical Warranty (Years)</Label>
                <Input
                  id="electrical_years"
                  type="number"
                  value={formData.warranty_electrical_years}
                  onChange={(e) => setFormData({...formData, warranty_electrical_years: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="electrical_km">Electrical Warranty (KM)</Label>
                <Input
                  id="electrical_km"
                  type="number"
                  value={formData.warranty_electrical_km}
                  onChange={(e) => setFormData({...formData, warranty_electrical_km: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="has_hybrid_battery"
                  checked={formData.has_hybrid_battery}
                  onChange={(e) => setFormData({...formData, has_hybrid_battery: e.target.checked})}
                />
                <Label htmlFor="has_hybrid_battery">Has Hybrid Battery</Label>
              </div>

              {formData.has_hybrid_battery && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="battery_years">Battery Warranty (Years)</Label>
                    <Input
                      id="battery_years"
                      type="number"
                      value={formData.warranty_battery_years}
                      onChange={(e) => setFormData({...formData, warranty_battery_years: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="battery_km">Battery Warranty (KM)</Label>
                    <Input
                      id="battery_km"
                      type="number"
                      value={formData.warranty_battery_km}
                      onChange={(e) => setFormData({...formData, warranty_battery_km: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveWarrantyConfiguration} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
