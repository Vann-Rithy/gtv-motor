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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Loader2, Settings } from "lucide-react"
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
    specifications: "",
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
      specifications: "",
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
        specifications: formData.specifications ? JSON.parse(formData.specifications) : {}
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
      specifications: model.specifications ? JSON.stringify(JSON.parse(model.specifications), null, 2) : "",
      is_active: model.is_active === "1"
    })
    setIsDialogOpen(true)
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
                <Label htmlFor="specifications">Specifications (JSON)</Label>
                <Textarea
                  id="specifications"
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  placeholder='{"weight": "120kg", "max_speed": "120 km/h", "fuel_capacity": "12L"}'
                  rows={4}
                />
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
                  <TableRow key={model.id}>
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
                          onClick={() => handleEdit(model)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(model.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
