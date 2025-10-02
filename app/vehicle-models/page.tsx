"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Search, Edit, Trash2, Car, Loader2, Eye, EyeOff, Info, Calendar, DollarSign, Wrench, Settings, Palette, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { apiClient } from "@/lib/api-client"

interface VehicleModel {
  id: number
  name: string
  description: string
  category: string
  base_price: number | string
  estimated_duration: number | string
  warranty_km_limit: number | string
  warranty_max_services: number | string
  engine_type: string
  cc_displacement?: number | string
  fuel_type: string
  transmission: string
  color_options: string[] | string
  year_range: string
  specifications: Record<string, any> | string
  is_active: boolean | string
  created_at: string
  updated_at: string
}

export default function VehicleModelsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  
  // State management
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid")
  const [expandedModel, setExpandedModel] = useState<number | null>(null)
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
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

  // Load vehicle models on component mount
  useEffect(() => {
    fetchVehicleModels()
  }, [])

  // Fetch vehicle models from API
  const fetchVehicleModels = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getVehicleModels()
      if (response.success && response.data) {
        setVehicleModels(response.data)
      } else {
        toast.error("Failed to load vehicle models")
      }
    } catch (error) {
      console.error("Error fetching vehicle models:", error)
      toast.error("Failed to load vehicle models")
    } finally {
      setLoading(false)
    }
  }

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
        toast.success(editingModel ? "Vehicle model updated successfully" : "Vehicle model created successfully")
        setIsDialogOpen(false)
        resetForm()
        fetchVehicleModels()
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
      base_price: String(model.base_price),
      estimated_duration: String(model.estimated_duration),
      warranty_km_limit: String(model.warranty_km_limit),
      warranty_max_services: String(model.warranty_max_services),
      engine_type: model.engine_type,
      cc_displacement: model.cc_displacement ? String(model.cc_displacement) : "",
      fuel_type: model.fuel_type,
      transmission: model.transmission,
      color_options: Array.isArray(model.color_options) ? model.color_options.join(', ') : (typeof model.color_options === 'string' ? model.color_options : ""),
      year_range: model.year_range,
      specifications: typeof model.specifications === 'object' ? JSON.stringify(model.specifications, null, 2) : (typeof model.specifications === 'string' ? model.specifications : ""),
      is_active: model.is_active === "1" || model.is_active === true
    })
    setIsDialogOpen(true)
  }

  // Handle delete
  const handleDelete = async (modelId: number) => {
    try {
      const response = await apiClient.deleteVehicleModel(modelId)
      if (response.success) {
        toast.success("Vehicle model deleted successfully")
        fetchVehicleModels()
      } else {
        toast.error("Failed to delete vehicle model")
      }
    } catch (error) {
      console.error("Error deleting vehicle model:", error)
      toast.error("Failed to delete vehicle model")
    }
  }

  // Handle toggle status
  const handleToggleStatus = async (model: VehicleModel) => {
    try {
      const isCurrentlyActive = model.is_active === "1" || model.is_active === true
      const response = await apiClient.updateVehicleModel(model.id, {
        ...model,
        is_active: !isCurrentlyActive
      })

      if (response.success) {
        toast.success(`Vehicle model ${!isCurrentlyActive ? 'activated' : 'deactivated'} successfully`)
        fetchVehicleModels()
      } else {
        toast.error("Failed to update vehicle model status")
      }
    } catch (error) {
      console.error("Error updating vehicle model status:", error)
      toast.error("Failed to update vehicle model status")
    }
  }

  // Filter vehicle models
  const filteredModels = vehicleModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || model.category === categoryFilter
    const isActive = model.is_active === "1" || model.is_active === true
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && isActive) ||
                         (statusFilter === "inactive" && !isActive)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Get unique categories
  const categories = Array.from(new Set(vehicleModels.map(model => model.category)))

  // Helper function to parse color options
  const parseColorOptions = (colorOptions: string[] | string) => {
    if (Array.isArray(colorOptions)) return colorOptions
    if (typeof colorOptions === 'string') {
      try {
        return JSON.parse(colorOptions)
      } catch {
        return colorOptions.split(',').map(c => c.trim())
      }
    }
    return []
  }

  // Helper function to parse specifications
  const parseSpecifications = (specs: Record<string, any> | string) => {
    if (typeof specs === 'object') return specs
    if (typeof specs === 'string') {
      try {
        return JSON.parse(specs)
      } catch {
        return {}
      }
    }
    return {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading vehicle models...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Car className="h-8 w-8 mr-3 text-blue-600" />
              {t('nav.vehicle_models', 'Vehicle Models')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage vehicle models, specifications, and pricing information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-3"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-3"
            >
              Table
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle Model
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingModel ? "Edit Vehicle Model" : "Add New Vehicle Model"}
                </DialogTitle>
                <DialogDescription>
                  {editingModel ? "Update the vehicle model information" : "Create a new vehicle model with specifications"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Info className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Model Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter model name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                          <SelectItem value="Compact SUV">Compact SUV</SelectItem>
                          <SelectItem value="Premium SUV">Premium SUV</SelectItem>
                          <SelectItem value="Mid-level SUV">Mid-level SUV</SelectItem>
                          <SelectItem value="Pick-up Truck">Pick-up Truck</SelectItem>
                          <SelectItem value="MPV">MPV</SelectItem>
                          <SelectItem value="Heavy Duty">Heavy Duty</SelectItem>
                          <SelectItem value="Luxury">Luxury</SelectItem>
                          <SelectItem value="Family">Family</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter model description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Pricing & Service */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Pricing & Service</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base_price">Base Price ($)</Label>
                      <Input
                        id="base_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimated_duration">Service Duration (minutes)</Label>
                      <Input
                        id="estimated_duration"
                        type="number"
                        placeholder="60"
                        value={formData.estimated_duration}
                        onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Warranty Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Warranty Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="warranty_km_limit">Warranty KM Limit</Label>
                      <Input
                        id="warranty_km_limit"
                        type="number"
                        placeholder="15000"
                        value={formData.warranty_km_limit}
                        onChange={(e) => setFormData({ ...formData, warranty_km_limit: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warranty_max_services">Max Warranty Services</Label>
                      <Input
                        id="warranty_max_services"
                        type="number"
                        placeholder="2"
                        value={formData.warranty_max_services}
                        onChange={(e) => setFormData({ ...formData, warranty_max_services: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Engine & Performance */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Wrench className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold">Engine & Performance</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="engine_type">Engine Type</Label>
                      <Select
                        value={formData.engine_type}
                        onValueChange={(value) => setFormData({ ...formData, engine_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select engine type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4-Stroke">4-Stroke</SelectItem>
                          <SelectItem value="1.5L Petrol">1.5L Petrol</SelectItem>
                          <SelectItem value="1.5T / 2.0T Turbo">1.5T / 2.0T Turbo</SelectItem>
                          <SelectItem value="2.0T Turbo">2.0T Turbo</SelectItem>
                          <SelectItem value="1.5L Turbo">1.5L Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cc_displacement">CC Displacement</Label>
                      <Input
                        id="cc_displacement"
                        type="number"
                        placeholder="150"
                        value={formData.cc_displacement}
                        onChange={(e) => setFormData({ ...formData, cc_displacement: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuel_type">Fuel Type</Label>
                      <Select
                        value={formData.fuel_type}
                        onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Gasoline">Gasoline</SelectItem>
                          <SelectItem value="Petrol">Petrol</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Electric">Electric</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transmission">Transmission</Label>
                      <Select
                        value={formData.transmission}
                        onValueChange={(value) => setFormData({ ...formData, transmission: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transmission" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Automatic">Automatic</SelectItem>
                          <SelectItem value="CVT">CVT</SelectItem>
                          <SelectItem value="Manual/Automatic">Manual/Automatic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Additional Features */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Palette className="h-5 w-5 text-pink-600" />
                    <h3 className="text-lg font-semibold">Additional Features</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year_range">Year Range</Label>
                      <Input
                        id="year_range"
                        placeholder="2020-2025"
                        value={formData.year_range}
                        onChange={(e) => setFormData({ ...formData, year_range: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color_options">Color Options (comma-separated)</Label>
                      <Input
                        id="color_options"
                        placeholder="Black, White, Red, Blue"
                        value={formData.color_options}
                        onChange={(e) => setFormData({ ...formData, color_options: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specifications">Specifications (JSON format)</Label>
                    <Textarea
                      id="specifications"
                      placeholder='{"weight": "120kg", "max_speed": "120 km/h", "fuel_capacity": "12L"}'
                      value={formData.specifications}
                      onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingModel ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingModel ? "Update Model" : "Create Model"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Vehicle Models ({filteredModels.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredModels.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No vehicle models found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first vehicle model"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModels.map((model) => {
                const isExpanded = expandedModel === model.id
                const colorOptions = parseColorOptions(model.color_options)
                const specifications = parseSpecifications(model.specifications)
                const isActive = model.is_active === "1" || model.is_active === true

                return (
                  <Card key={model.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center">
                            <Car className="h-5 w-5 mr-2 text-blue-600" />
                            {model.name}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {model.description}
                          </CardDescription>
                        </div>
                        <Badge variant={isActive ? "default" : "secondary"} className="ml-2">
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center">
                          <Badge variant="outline" className="text-xs">{model.category}</Badge>
                        </div>
                        <div className="flex items-center text-green-600 font-semibold">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${Number(model.base_price || 0).toFixed(2)}
                        </div>
                      </div>

                      {/* Engine Info */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <Wrench className="h-4 w-4 mr-2 text-gray-600" />
                          <span className="text-sm font-medium">Engine</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>{model.engine_type}</div>
                          {model.cc_displacement && (
                            <div className="text-gray-600">{Number(model.cc_displacement)}cc</div>
                          )}
                          <div className="text-gray-600">{model.fuel_type} • {model.transmission}</div>
                        </div>
                      </div>

                      {/* Warranty Info */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <Settings className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-sm font-medium">Warranty</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>{Number(model.warranty_km_limit || 0).toLocaleString()} km</div>
                          <div className="text-gray-600">{Number(model.warranty_max_services || 0)} services</div>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="space-y-3 pt-3 border-t">
                          {/* Color Options */}
                          {colorOptions.length > 0 && (
                            <div>
                              <div className="flex items-center mb-2">
                                <Palette className="h-4 w-4 mr-2 text-gray-600" />
                                <span className="text-sm font-medium">Colors</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {colorOptions.map((color, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {color}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Year Range */}
                          {model.year_range && (
                            <div>
                              <div className="flex items-center mb-2">
                                <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                                <span className="text-sm font-medium">Year Range</span>
                              </div>
                              <div className="text-sm text-gray-600">{model.year_range}</div>
                            </div>
                          )}

                          {/* Specifications */}
                          {Object.keys(specifications).length > 0 && (
                            <div>
                              <div className="flex items-center mb-2">
                                <FileText className="h-4 w-4 mr-2 text-gray-600" />
                                <span className="text-sm font-medium">Specifications</span>
                              </div>
                              <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
                                {Object.entries(specifications).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span className="font-medium">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Service Duration */}
                          <div>
                            <div className="flex items-center mb-2">
                              <Info className="h-4 w-4 mr-2 text-gray-600" />
                              <span className="text-sm font-medium">Service Duration</span>
                            </div>
                            <div className="text-sm text-gray-600">{Number(model.estimated_duration || 0)} minutes</div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedModel(isExpanded ? null : model.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              More
                            </>
                          )}
                        </Button>

                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(model)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(model)}
                            className={isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                          >
                            {isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Engine</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.map((model) => {
                    const isActive = model.is_active === "1" || model.is_active === true
                    return (
                      <TableRow key={model.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{model.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{model.category}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ${Number(model.base_price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{model.engine_type}</div>
                            {model.cc_displacement && (
                              <div className="text-gray-500">{Number(model.cc_displacement)}cc</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(model)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(model)}
                              className={isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                            >
                              {isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}