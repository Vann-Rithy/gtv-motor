"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Loader2, Settings, Car, Wrench, Palette, FileText, Calendar, DollarSign } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

interface VehicleModel {
  id: string
  name: string
  description: string
  category: string
  base_price: string
  estimated_duration: string
  warranty_km_limit: string
  warranty_max_services: string
  engine_type: string
  cc_displacement: string
  fuel_type: string
  transmission: string
  color_options: string
  year_range: string
  specifications: string
  is_active: string
  created_at: string
  updated_at: string
}

export default function VehicleModelsPage() {
  const { toast } = useToast()
  const [models, setModels] = useState<VehicleModel[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null)
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Motorcycle",
    base_price: "",
    estimated_duration: "",
    warranty_km_limit: "",
    warranty_max_services: "",
    engine_type: "4-Stroke",
    cc_displacement: "",
    fuel_type: "Gasoline",
    transmission: "Manual",
    color_options: "",
    year_range: "",
    specifications: [] as Array<{key: string, value: string}>,
    is_active: true
  })

  const categories = ["Motorcycle", "Heavy Duty", "Family", "Luxury", "Scooter", "ATV"]
  const engineTypes = ["4-Stroke", "2-Stroke", "Electric"]
  const fuelTypes = ["Gasoline", "Electric", "Hybrid"]
  const transmissions = ["Manual", "Automatic", "CVT"]

  // Fetch vehicle models
  const fetchModels = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getVehicleModels()
      if (response.success && response.data) {
        setModels(response.data)
      } else {
        setError("Failed to fetch vehicle models")
        toast({
          title: "Error",
          description: "Failed to fetch vehicle models",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching vehicle models:", error)
      setError("Failed to fetch vehicle models")
      toast({
        title: "Error",
        description: "Failed to fetch vehicle models",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "Motorcycle",
      base_price: "",
      estimated_duration: "",
      warranty_km_limit: "",
      warranty_max_services: "",
      engine_type: "4-Stroke",
      cc_displacement: "",
      fuel_type: "Gasoline",
      transmission: "Manual",
      color_options: "",
      year_range: "",
      specifications: [],
      is_active: true
    })
    setEditingModel(null)
    setError(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price) || 0,
        estimated_duration: parseInt(formData.estimated_duration) || 60,
        warranty_km_limit: parseInt(formData.warranty_km_limit) || 15000,
        warranty_max_services: parseInt(formData.warranty_max_services) || 2,
        cc_displacement: formData.cc_displacement ? parseInt(formData.cc_displacement) : null,
        color_options: formData.color_options ? formData.color_options.split(',').map(c => c.trim()) : [],
        specifications: formData.specifications.reduce((acc, spec) => {
          if (spec.key.trim() && spec.value.trim()) {
            acc[spec.key.trim()] = spec.value.trim()
          }
          return acc
        }, {} as Record<string, string>)
      }

      let response
      if (editingModel) {
        response = await apiClient.updateVehicleModel(editingModel.id, payload)
      } else {
        response = await apiClient.createVehicleModel(payload)
      }

      if (response.success) {
        toast({
          title: "Success",
          description: editingModel ? "Vehicle model updated successfully" : "Vehicle model created successfully"
        })
        setIsDialogOpen(false)
        resetForm()
        fetchModels()
      } else {
        setError(response.message || "Failed to save vehicle model")
      }
    } catch (error) {
      console.error("Error saving vehicle model:", error)
      setError("Failed to save vehicle model")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = (model: VehicleModel) => {
    setEditingModel(model)
    setFormData({
      name: model.name,
      description: model.description,
      category: model.category,
      base_price: model.base_price,
      estimated_duration: model.estimated_duration,
      warranty_km_limit: model.warranty_km_limit,
      warranty_max_services: model.warranty_max_services,
      engine_type: model.engine_type,
      cc_displacement: model.cc_displacement,
      fuel_type: model.fuel_type,
      transmission: model.transmission,
      color_options: model.color_options ? JSON.parse(model.color_options).join(', ') : "",
      year_range: model.year_range,
      specifications: (() => {
        try {
          const specs = model.specifications ? JSON.parse(model.specifications) : {}
          return Object.entries(specs).map(([key, value]) => ({ key, value: String(value) }))
        } catch {
          return []
        }
      })(),
      is_active: model.is_active === "1"
    })
    setIsDialogOpen(true)
  }

  // Handle view details
  const handleViewDetails = (model: VehicleModel) => {
    setSelectedModel(model)
    setIsDetailDialogOpen(true)
  }

  // Handle specifications
  const addSpecification = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: "", value: "" }]
    })
  }

  const removeSpecification = (index: number) => {
    setFormData({
      ...formData,
      specifications: formData.specifications.filter((_, i) => i !== index)
    })
  }

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const updatedSpecs = [...formData.specifications]
    updatedSpecs[index] = { ...updatedSpecs[index], [field]: value }
    setFormData({
      ...formData,
      specifications: updatedSpecs
    })
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle model?")) return

    try {
      const response = await apiClient.deleteVehicleModel(id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Vehicle model deleted successfully"
        })
        fetchModels()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete vehicle model",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting vehicle model:", error)
      toast({
        title: "Error",
        description: "Failed to delete vehicle model",
        variant: "destructive"
      })
    }
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Motorcycle": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "Heavy Duty": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "Family": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Luxury": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "Scooter": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "ATV": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading vehicle models...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Models</h1>
          <p className="text-muted-foreground">Manage vehicle models and specifications</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingModel ? "Edit Vehicle Model" : "Add New Vehicle Model"}
              </DialogTitle>
              <DialogDescription>
                {editingModel ? "Update the vehicle model information" : "Create a new vehicle model with specifications"}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., SOBEN"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Vehicle model description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="base_price">Base Price ($)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="1200.00"
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_duration">Service Duration (min)</Label>
                  <Input
                    id="estimated_duration"
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                    placeholder="60"
                  />
                </div>
                <div>
                  <Label htmlFor="cc_displacement">CC Displacement</Label>
                  <Input
                    id="cc_displacement"
                    type="number"
                    value={formData.cc_displacement}
                    onChange={(e) => setFormData({ ...formData, cc_displacement: e.target.value })}
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="engine_type">Engine Type</Label>
                  <Select value={formData.engine_type} onValueChange={(value) => setFormData({ ...formData, engine_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {engineTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fuel_type">Fuel Type</Label>
                  <Select value={formData.fuel_type} onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="transmission">Transmission</Label>
                  <Select value={formData.transmission} onValueChange={(value) => setFormData({ ...formData, transmission: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {transmissions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warranty_km_limit">Warranty KM Limit</Label>
                  <Input
                    id="warranty_km_limit"
                    type="number"
                    value={formData.warranty_km_limit}
                    onChange={(e) => setFormData({ ...formData, warranty_km_limit: e.target.value })}
                    placeholder="15000"
                  />
                </div>
                <div>
                  <Label htmlFor="warranty_max_services">Max Warranty Services</Label>
                  <Input
                    id="warranty_max_services"
                    type="number"
                    value={formData.warranty_max_services}
                    onChange={(e) => setFormData({ ...formData, warranty_max_services: e.target.value })}
                    placeholder="2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="color_options">Color Options (comma-separated)</Label>
                <Input
                  id="color_options"
                  value={formData.color_options}
                  onChange={(e) => setFormData({ ...formData, color_options: e.target.value })}
                  placeholder="Black, White, Red, Blue"
                />
              </div>

              <div>
                <Label htmlFor="year_range">Year Range</Label>
                <Input
                  id="year_range"
                  value={formData.year_range}
                  onChange={(e) => setFormData({ ...formData, year_range: e.target.value })}
                  placeholder="2020-2025"
                />
              </div>

              <div>
                <Label>Specifications</Label>
                <div className="space-y-2">
                  {formData.specifications.map((spec, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Specification name (e.g., Weight)"
                        value={spec.key}
                        onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value (e.g., 150kg)"
                        value={spec.value}
                        onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSpecification(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSpecification}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Specification
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingModel ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Models ({models.length})</CardTitle>
          <CardDescription>Manage all vehicle models in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vehicle models found</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first vehicle model</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle Model
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>CC</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow 
                    key={model.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewDetails(model)}
                  >
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(model.category)}>
                        {model.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(parseFloat(model.base_price))}</TableCell>
                    <TableCell>{model.cc_displacement}CC</TableCell>
                    <TableCell>{model.engine_type}</TableCell>
                    <TableCell>
                      <Badge variant={model.is_active === "1" ? "default" : "secondary"}>
                        {model.is_active === "1" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(model)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Vehicle Model</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{model.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(model.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Car className="h-6 w-6 mr-2 text-blue-600" />
              {selectedModel?.name} - Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this vehicle model
            </DialogDescription>
          </DialogHeader>
          
          {selectedModel && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Name</Label>
                    <p className="text-lg font-semibold">{selectedModel.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    <p className="text-sm">{selectedModel.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Category</Label>
                    <Badge variant="outline">{selectedModel.category}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge variant={selectedModel.is_active === "1" ? "default" : "secondary"}>
                      {selectedModel.is_active === "1" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Base Price</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(parseFloat(selectedModel.base_price))}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Year Range</Label>
                    <p className="text-sm">{selectedModel.year_range || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Service Duration</Label>
                    <p className="text-sm">{Number(selectedModel.estimated_duration || 0)} minutes</p>
                  </div>
                </div>
              </div>

              {/* Engine Specifications */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Engine Specifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Engine Type</Label>
                    <p className="text-sm">{selectedModel.engine_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Displacement</Label>
                    <p className="text-sm">{selectedModel.cc_displacement ? `${selectedModel.cc_displacement}cc` : "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Fuel Type</Label>
                    <p className="text-sm">{selectedModel.fuel_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Transmission</Label>
                    <p className="text-sm">{selectedModel.transmission}</p>
                  </div>
                </div>
              </div>

              {/* Warranty Information */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Warranty Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">KM Limit</Label>
                    <p className="text-sm">{Number(selectedModel.warranty_km_limit || 0).toLocaleString()} km</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Max Services</Label>
                    <p className="text-sm">{selectedModel.warranty_max_services} services</p>
                  </div>
                </div>
              </div>

              {/* Color Options */}
              {(() => {
                try {
                  const colors = selectedModel.color_options ? JSON.parse(selectedModel.color_options) : []
                  return colors.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Palette className="h-5 w-5 mr-2" />
                        Available Colors
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((color: string, index: number) => (
                          <Badge key={index} variant="outline">{color}</Badge>
                        ))}
                      </div>
                    </div>
                  )
                } catch {
                  return null
                }
              })()}

              {/* Specifications */}
              {(() => {
                try {
                  const specs = selectedModel.specifications ? JSON.parse(selectedModel.specifications) : {}
                  return Object.keys(specs).length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Technical Specifications
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(specs).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-600 capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-sm font-semibold">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                } catch {
                  return null
                }
              })()}

              {/* Timestamps */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Record Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Created</Label>
                    <p className="text-sm">{new Date(selectedModel.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                    <p className="text-sm">{new Date(selectedModel.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsDetailDialogOpen(false)
                handleEdit(selectedModel!)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
