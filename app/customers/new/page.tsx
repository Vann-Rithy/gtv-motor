"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const vehicleModels = ["SOBEN", "KAIN", "KOUPREY", "KRUSAR", "KESSOR"]

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
    setIsLoading(true)
    setError(null)

    try {
      // 1) Create customer
      const customerPayload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
      }

      const customerResponse = await apiClient.createCustomer(customerPayload)
      const customerId = (customerResponse as { data: { id: string | number } }).data.id.toString()

      // 2) Create vehicles linked to customer
      const vehiclePayloads = vehicles
        .filter((v) => v.plateNumber && v.model)
        .map((v) => ({
          customer_id: customerId,
          plate_number: v.plateNumber,
          model: v.model,
          vin_number: v.vinNumber || null,
          year: v.year ? Number.parseInt(v.year) : null,
          purchase_date: v.purchaseDate || null,
        }))

      if (vehiclePayloads.length) {
        await Promise.all(vehiclePayloads.map((p) => apiClient.createVehicle(p)))
      }

      // 3) Redirect to customers and OPEN details for this new customer
      router.push(`/customers?view=${encodeURIComponent(customerId)}`)
    } catch (err) {
      console.error("[v0] Error creating customer:", err)
      setError(err instanceof Error ? err.message : "Failed to create customer")
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

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

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
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
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
                    />
                  </div>
                  <div>
                    <Label>Model *</Label>
                    <Select value={vehicle.model} onValueChange={(value) => updateVehicle(vehicle.id, "model", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    />
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
            {isLoading ? "Adding Customer..." : "Add Customer"}
          </Button>
        </div>
      </form>
    </div>
  )
}
