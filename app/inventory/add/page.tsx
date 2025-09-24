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
import { ArrowLeft, Plus } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface Category {
  id: number
  name: string
  description?: string
}

export default function AddInventoryItem() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    sku: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    unitPrice: "",
    supplier: "",
    description: "",
  })

  // Load categories on component mount
  useEffect(() => {
    loadCategories()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.category_id || !formData.currentStock || 
        !formData.minStock || !formData.maxStock || !formData.unitPrice) {
      toast.error("Please fill in all required fields")
      return
    }

    if (Number(formData.minStock) > Number(formData.maxStock)) {
      toast.error("Minimum stock cannot be greater than maximum stock")
      return
    }

    try {
      setLoading(true)
      
      await apiClient.createInventoryItem({
        name: formData.name,
        sku: formData.sku || undefined,
        category_id: Number(formData.category_id),
        current_stock: Number(formData.currentStock),
        min_stock: Number(formData.minStock),
        max_stock: Number(formData.maxStock),
        unit_price: Number(formData.unitPrice),
        supplier: formData.supplier || undefined
      })

      toast.success("Inventory item created successfully!")
      router.push("/inventory")
    } catch (error) {
      console.error("Failed to create inventory item:", error)
      toast.error("Failed to create inventory item")
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
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add Inventory Item</h1>
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
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <div className="space-y-2">
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
            <CardTitle>Stock & Pricing</CardTitle>
            <CardDescription>Set stock levels and pricing information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="currentStock">Current Stock *</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="minStock">Minimum Stock *</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxStock">Maximum Stock *</Label>
                <Input
                  id="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unitPrice">Unit Price *</Label>
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
            {loading ? "Creating..." : "Add Item"}
          </Button>
        </div>
      </form>
    </div>
  )
}
