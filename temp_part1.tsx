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
      base_price: model.base_price.toString(),
      estimated_duration: model.estimated_duration.toString(),
      warranty_km_limit: model.warranty_km_limit.toString(),
      warranty_max_services: model.warranty_max_services.toString(),
      engine_type: model.engine_type,
      cc_displacement: model.cc_displacement?.toString() || "",
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
