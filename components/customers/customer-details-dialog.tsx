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
import { cn } from "@/lib/utils"

type ServiceItem = {
  id: number | string
  title: string
  dateISO: string
  amount: number
  status: "completed" | "in_progress" | "pending"
}

type Vehicle = {
  plate: string
  model: string
  vin?: string
  currentKm?: number
}

type Customer = {
  id: number | string
  name: string
  phone?: string
  email?: string
  address?: string
  vehicle: Vehicle
  services: ServiceItem[]
}

export type CustomerDetailsDialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  customer: Customer | null
}

function formatMoney(n: number) {
  try {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
  } catch {
    // Fallback if currency locale fails
    return `$${Number(n).toFixed(2)}`
  }
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
        className={cn(
          "max-w-3xl p-0 overflow-hidden", // width similar to screenshot
          "sm:rounded-xl"
        )}
      >
        <div className="p-6">
          {/* Header */}
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl">Customer Details</DialogTitle>
            {c ? (
              <DialogDescription className="text-sm text-muted-foreground">
                Complete information for <span className="font-medium text-foreground">{c.name}</span>
              </DialogDescription>
            ) : (
              <DialogDescription className="text-sm text-muted-foreground">Loading…</DialogDescription>
            )}
          </DialogHeader>

          {/* CONTENT */}
          {c && (
            <div className="space-y-5">
              {/* Contact Info */}
              <section>
                <h3 className="mb-2 text-sm font-semibold tracking-tight">Contact Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                  <div className="space-y-2">
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{c.name}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="break-all">{c.email ?? "-"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{c.phone ?? "-"}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                      <span className="text-muted-foreground">Address:</span>
                      <span>{c.address ?? "-"}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Vehicle */}
              <section>
                <h3 className="mb-2 text-sm font-semibold tracking-tight">Vehicles</h3>
                <div className="rounded-lg border bg-muted/40 p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                    <div className="space-y-2">
                      <div className="grid grid-cols-[70px_1fr] gap-2">
                        <span className="text-muted-foreground">Plate:</span>
                        <span className="font-medium">{c.vehicle.plate}</span>
                      </div>
                      <div className="grid grid-cols-[70px_1fr] gap-2">
                        <span className="text-muted-foreground">VIN:</span>
                        <span className="break-all">{c.vehicle.vin ?? "-"}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-[70px_1fr] gap-2">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="font-medium">{c.vehicle.model}</span>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] gap-2">
                        <span className="text-muted-foreground">Current KM:</span>
                        <span>{c.vehicle.currentKm?.toLocaleString() ?? "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Service History */}
              <section>
                <h3 className="mb-2 text-sm font-semibold tracking-tight">Service History</h3>
                <div className="space-y-2">
                  {c.services.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border bg-background px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{s.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(s.dateISO).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pl-4">
                        <div className="text-sm font-semibold tabular-nums">{formatMoney(s.amount)}</div>
                        <Badge
                          variant={
                            s.status === "completed" ? "default" : s.status === "in_progress" ? "secondary" : "outline"
                          }
                          className="capitalize"
                        >
                          {s.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {c.services.length === 0 && (
                    <div className="rounded-lg border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                      No service history yet
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
