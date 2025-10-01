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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Vehicle {
  id: string
  plateNumber: string
  model: string
  vinNumber: string
  year: string
  purchaseDate: string
}

export default function NewCustomer() {
  const router = useRouter()
  const { toast } = useToast()

  // Fetch vehicle models from API
  useEffect(() => {
    const fetchVehicleModels = async () => {
      try {
        setModelsLoading(true)
        const response = await apiClient.getVehicleModels()
        if (response.success && response.data) {
          setVehicleModels(response.data.map((model: any) => ({
            id: model.id.toString(),
            name: model.name,
            category: model.category
          })))
        } else {
          console.error('Failed to fetch vehicle models:', response.message)
          // Fallback to static models if API fails
          setVehicleModels([
            { id: '1', name: 'SOBEN', category: 'Compact SUV' },
            { id: '2', name: 'CAESAR', category: 'Mid-level SUV' },
            { id: '3', name: 'KAIN', category: 'Premium SUV' },
            { id: '4', name: 'KRUSAR', category: 'Pick-up Truck' },
            { id: '5', name: 'SOBEN-P', category: 'MPV' }
          ])
        }
      } catch (error) {
        console.error('Error fetching vehicle models:', error)
        // Fallback to static models if API fails
        setVehicleModels([
          { id: '1', name: 'SOBEN', category: 'Compact SUV' },
          { id: '2', name: 'CAESAR', category: 'Mid-level SUV' },
          { id: '3', name: 'KAIN', category: 'Premium SUV' },
          { id: '4', name: 'KRUSAR', category: 'Pick-up Truck' },
          { id: '5', name: 'SOBEN-P', category: 'MPV' }
        ])
      } finally {
        setModelsLoading(false)
      }
    }

    fetchVehicleModels()
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [countdown, setCountdown] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  })
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: "1",
      plateNumber: "",
      model: "",
      vinNumber: "",
      year: "",
      purchaseDate: "",
    },
  ])

  // Dynamic vehicle models from API
  const [vehicleModels, setVehicleModels] = useState<Array<{id: string, name: string, category: string}>>([])
  const [modelsLoading, setModelsLoading] = useState(true)

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '')

    // Limit to 10 digits
    const limitedPhone = phoneNumber.slice(0, 10)

    // Format based on length
    if (limitedPhone.length <= 3) {
      return limitedPhone
    } else if (limitedPhone.length <= 6) {
      return `${limitedPhone.slice(0, 3)}-${limitedPhone.slice(3)}`
    } else {
      return `${limitedPhone.slice(0, 3)}-${limitedPhone.slice(3, 6)}-${limitedPhone.slice(6)}`
    }
  }

  // Phone number validation function
  const validatePhoneNumber = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '')

    // Check if it's exactly 10 digits
    if (digitsOnly.length !== 10) {
      return "Phone number must be exactly 10 digits"
    }

    // Check if it starts with valid area codes (Cambodia)
    const validPrefixes = ['01', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99']

    if (!validPrefixes.includes(digitsOnly.slice(0, 2))) {
      return "Please enter a valid Cambodian phone number"
    }

    return null // Valid
  }

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Customer validation
    if (!formData.name.trim()) {
      errors.name = "Customer name is required"
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required"
    } else {
      const phoneValidation = validatePhoneNumber(formData.phone)
      if (phoneValidation) {
        errors.phone = phoneValidation
      }
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    // Vehicle validation
    vehicles.forEach((vehicle, index) => {
      if (!vehicle.plateNumber.trim()) {
        errors[`vehicle_${index}_plate`] = "Plate number is required"
      }
      if (!vehicle.model.trim()) {
        errors[`vehicle_${index}_model`] = "Model is required"
      }
      if (vehicle.year && (parseInt(vehicle.year) < 2000 || parseInt(vehicle.year) > 2025)) {
        errors[`vehicle_${index}_year`] = "Year must be between 2000 and 2025"
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const addVehicle = () => {
    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      plateNumber: "",
      model: "",
      vinNumber: "",
      year: "",
      purchaseDate: "",
    }
    setVehicles((v) => [...v, newVehicle])
  }

  const removeVehicle = (id: string) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((v) => v.id !== id))
    }
  }

  const updateVehicle = (id: string, field: keyof Vehicle, value: string) => {
    setVehicles((arr) => arr.map((v) => (v.id === id ? { ...v, [field]: value } : v)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous messages
    setError(null)
    setSuccess(null)
    setValidationErrors({})

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 1) Create customer
      const customerPayload = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ''), // Remove formatting, keep only digits
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
      }

      console.log("Creating customer:", customerPayload)
      const customerResponse = await apiClient.createCustomer(customerPayload)

      if (!customerResponse.success) {
        throw new Error(customerResponse.message || "Failed to create customer")
      }

      const customerId = customerResponse.data.id.toString()
      console.log("Customer created with ID:", customerId)

      // 2) Create vehicles linked to customer
      const vehiclePayloads = vehicles
        .filter((v) => v.plateNumber.trim() && v.model.trim())
        .map((v) => ({
          customer_id: customerId,
          plate_number: v.plateNumber.trim(),
          model: v.model.trim(),
          vin_number: v.vinNumber.trim() || null,
          year: v.year ? parseInt(v.year) : null,
          purchase_date: v.purchaseDate || null,
        }))

      if (vehiclePayloads.length > 0) {
        console.log("Creating vehicles:", vehiclePayloads)
        await Promise.all(vehiclePayloads.map((p) => apiClient.createVehicle(p)))
        console.log("All vehicles created successfully")
      }

      // 3) Show success message
      const successMessage = `Customer "${formData.name}" created successfully with ${vehiclePayloads.length} vehicle(s)!`
      setSuccess(successMessage)

      toast({
        title: "Success!",
        description: successMessage,
        variant: "default",
      })

      // 4) Start countdown and redirect
      setCountdown(3)
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval)
            router.push(`/customers?view=${encodeURIComponent(customerId)}`)
            return null
          }
          return prev - 1
        })
      }, 1000)

    } catch (err) {
      console.error("[v0] Error creating customer:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to create customer"
      setError(errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add New Customer</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200 animate-pulse">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {success}
            {countdown && (
              <span className="block mt-1 text-sm">
                Redirecting to customer details in {countdown} second{countdown !== 1 ? 's' : ''}...
              </span>
            )}
          </AlertDescription>
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/customers')}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              View Customer List
            </Button>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Enter basic customer details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                  required
                  className={validationErrors.name ? "border-red-500" : ""}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value)
                    setFormData({ ...formData, phone: formatted })
                  }}
                  placeholder="012-345-6789"
                  required
                  className={validationErrors.phone ? "border-red-500" : ""}
                  maxLength={12} // 10 digits + 2 dashes
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Enter 10-digit Cambodian phone number (e.g., 012-345-6789)
                </p>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  className={validationErrors.email ? "border-red-500" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Description</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional description about the customer"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Vehicle Information</CardTitle>
                <CardDescription>Add customer's vehicles</CardDescription>
              </div>
              <Button type="button" onClick={addVehicle} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {vehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Vehicle {index + 1}</h3>
                  {vehicles.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeVehicle(vehicle.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Plate Number *</Label>
                    <Input
                      value={vehicle.plateNumber}
                      onChange={(e) => updateVehicle(vehicle.id, "plateNumber", e.target.value)}
                      placeholder="2CD-7960"
                      required
                      className={validationErrors[`vehicle_${index}_plate`] ? "border-red-500" : ""}
                    />
                    {validationErrors[`vehicle_${index}_plate`] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors[`vehicle_${index}_plate`]}</p>
                    )}
                  </div>
                  <div>
                    <Label>Model *</Label>
                    <Select value={vehicle.model} onValueChange={(value) => updateVehicle(vehicle.id, "model", value)}>
                      <SelectTrigger className={validationErrors[`vehicle_${index}_model`] ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading models...
                          </SelectItem>
                        ) : (
                          vehicleModels.map((model) => (
                            <SelectItem key={model.id} value={model.name}>
                              {model.name} ({model.category})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors[`vehicle_${index}_model`] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors[`vehicle_${index}_model`]}</p>
                    )}
                  </div>
                  <div>
                    <Label>VIN Number</Label>
                    <Input
                      value={vehicle.vinNumber}
                      onChange={(e) => updateVehicle(vehicle.id, "vinNumber", e.target.value)}
                      placeholder="LUYJB2G27SA009637"
                    />
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={vehicle.year}
                      onChange={(e) => updateVehicle(vehicle.id, "year", e.target.value)}
                      placeholder="2023"
                      min="2000"
                      max="2025"
                      className={validationErrors[`vehicle_${index}_year`] ? "border-red-500" : ""}
                    />
                    {validationErrors[`vehicle_${index}_year`] && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors[`vehicle_${index}_year`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Service Date</Label>
                    <Input
                      type="date"
                      value={vehicle.purchaseDate}
                      onChange={(e) => updateVehicle(vehicle.id, "purchaseDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding Customer...
              </>
            ) : (
              "Add Customer"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
