"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Upload, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Category {
  id: number
  name: string
  description?: string
}

interface VehicleModel {
  id: number
  name: string
  category?: string
}

export default function AddInventoryItem() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    partPlate: "",
    name: "",
    nameKhmer: "",
    vehicle_model_id: "",
    category_id: "",
    sku: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    unitPrice: "",
    supplier: "",
    description: "",
  })

  // Load categories and vehicle models on component mount
  useEffect(() => {
    loadCategories()
    loadVehicleModels()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await apiClient.getInventoryCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error("Failed to load categories:", error)
      toast.error("Failed to load categories")
    }
  }

  const loadVehicleModels = async () => {
    try {
      const response = await apiClient.getVehicleModels()
      if (response.success && response.data) {
        setVehicleModels(response.data)
      }
    } catch (error) {
      console.error("Failed to load vehicle models:", error)
      toast.error("Failed to load vehicle models")
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      const response = await apiClient.createInventoryCategory({
        name: newCategoryName.trim(),
        description: ""
      })
      
      toast.success("Category created successfully")
      setNewCategoryName("")
      setShowNewCategory(false)
      await loadCategories() // Reload categories
      
      // Auto-select the new category
      setFormData(prev => ({
        ...prev,
        category_id: response.data.id.toString()
      }))
    } catch (error) {
      console.error("Failed to create category:", error)
      toast.error("Failed to create category")
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Only JPEG, PNG, and GIF images are allowed.")
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds maximum allowed size of 5MB")
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.unitPrice) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.minStock && formData.maxStock && Number(formData.minStock) > Number(formData.maxStock)) {
      toast.error("Minimum stock cannot be greater than maximum stock")
      return
    }

    try {
      setLoading(true)
      
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('part_plate', formData.partPlate)
      formDataToSend.append('name', formData.name)
      formDataToSend.append('name_khmer', formData.nameKhmer)
      formDataToSend.append('unit_price', formData.unitPrice)
      
      if (formData.vehicle_model_id) {
        formDataToSend.append('vehicle_model_id', formData.vehicle_model_id)
      }
      if (formData.category_id) {
        formDataToSend.append('category_id', formData.category_id)
      }
      if (formData.sku && formData.sku.trim() !== '') {
        formDataToSend.append('sku', formData.sku.trim())
      }
      if (formData.currentStock) {
        formDataToSend.append('current_stock', formData.currentStock)
      }
      if (formData.minStock) {
        formDataToSend.append('min_stock', formData.minStock)
      }
      if (formData.maxStock) {
        formDataToSend.append('max_stock', formData.maxStock)
      }
      if (formData.supplier) {
        formDataToSend.append('supplier', formData.supplier)
      }
      
      // Add image if selected
      if (selectedImage) {
        formDataToSend.append('image', selectedImage)
      }
      
      // Use fetch directly since apiClient might not handle FormData well
      const response = await fetch('/api/inventory', {
        method: 'POST',
        body: formDataToSend,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        // Provide more specific error message
        const errorMessage = result.message || result.error || `Failed to create part (${response.status})`
        throw new Error(errorMessage)
      }

      toast.success("Part added successfully!")
      router.push("/inventory")
    } catch (error: any) {
      console.error("Failed to create part:", error)
      toast.error(error.message || "Failed to create part")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add Part</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Item Information</CardTitle>
            <CardDescription>Enter details for the new inventory item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partPlate">Part Plate</Label>
                <Input
                  id="partPlate"
                  value={formData.partPlate}
                  onChange={(e) => setFormData({ ...formData, partPlate: e.target.value })}
                  placeholder="Enter part plate number"
                />
              </div>
              <div>
                <Label htmlFor="name">Part Name (English) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter part name in English"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameKhmer">Part Name (Khmer)</Label>
                <Input
                  id="nameKhmer"
                  value={formData.nameKhmer}
                  onChange={(e) => setFormData({ ...formData, nameKhmer: e.target.value })}
                  placeholder="Enter part name in Khmer"
                />
              </div>
              <div>
                <Label htmlFor="vehicleModel">Model Car</Label>
                <Select
                  value={formData.vehicle_model_id || undefined}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_model_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select car model (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleModels.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <div className="space-y-2">
                  <Select
                    value={formData.category_id || undefined}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewCategory(!showNewCategory)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Category
                  </Button>
                </div>
                {showNewCategory && (
                  <div className="mt-2 p-3 border rounded-md bg-muted/50">
                    <div className="flex gap-2">
                      <Input
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                      />
                      <Button type="button" size="sm" onClick={handleCreateCategory}>
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setShowNewCategory(false)
                          setNewCategoryName("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Enter SKU code"
                />
              </div>
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Enter supplier name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="image">Image</Label>
              <div className="space-y-2">
                {!imagePreview ? (
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative w-full">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-300">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter item description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set the price for this part</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="unitPrice">Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Add Part"}
          </Button>
        </div>
      </form>
    </div>
  )
}
