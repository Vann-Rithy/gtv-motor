"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, MapPin, Car, Calendar, DollarSign } from "lucide-react"
import { cn, formatKM, formatCurrency } from "@/lib/utils"

type ServiceItem = {
  id: number | string
  service_type_name: string
  service_date: string
  total_amount: number
  service_status: "completed" | "in_progress" | "pending"
}

type Vehicle = {
  plate_number?: string
  model?: string
  vin_number?: string
  current_km?: number
}

type Customer = {
  id: number | string
  name: string
  phone?: string
  email?: string
  address?: string
  latest_vehicle_plate?: string
  latest_vehicle_model?: string
  vehicle_count?: number
  service_count?: number
  total_spent?: number
  last_service_date?: string
  vehicles?: Vehicle[]
  recent_services?: ServiceItem[]
}

export type CustomerDetailsDialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  customer: Customer | null
}

function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return "N/A"
  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.length === 10) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
  }
  return phone // Return original if not 10 digits
}

export default function CustomerDetailsDialog({
  open,
  onOpenChange,
  customer,
}: CustomerDetailsDialogProps) {
  const c = customer

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Allow closing by clicking outside
          e.preventDefault()
          onOpenChange(false)
        }}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-semibold pr-8">Customer Details</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-0 right-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </DialogHeader>

        {c && (
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">Name:</div>
                      <div className="text-sm font-semibold">{c.name}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">Email:</div>
                      <div className="text-sm">{c.email || "N/A"}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">Phone:</div>
                      <div className="text-sm">{formatPhoneNumber(c.phone)}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">Address:</div>
                      <div className="text-sm">{c.address || "N/A"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                {c.vehicles && c.vehicles.length > 0 ? (
                  <div className="space-y-4">
                    {c.vehicles.map((vehicle, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <Car className="h-4 w-4 text-gray-500" />
                              <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">Plate:</div>
                              <div className="text-sm font-semibold">{vehicle.plate_number || "N/A"}</div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">VIN:</div>
                              <div className="text-sm font-mono">{vehicle.vin_number || "N/A"}</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">Model:</div>
                              <div className="text-sm">{vehicle.model || "N/A"}</div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">Current KM:</div>
                              <div className="text-sm">{formatKM(vehicle.current_km)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No vehicles found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service History</CardTitle>
              </CardHeader>
              <CardContent>
                {c.recent_services && c.recent_services.length > 0 ? (
                  <div className="space-y-3">
                    {c.recent_services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm font-medium">{service.service_type_name}</div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(service.service_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatCurrency(service.total_amount)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            "ml-4",
                            service.service_status === "completed" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            service.service_status === "in_progress" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                            service.service_status === "pending" && "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          )}
                        >
                          {service.service_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No service history found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}