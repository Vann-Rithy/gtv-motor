// app/services/new/page.tsx
"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Search, Plus, Trash2, Loader2, Package, User, Car, X, DollarSign } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import BookingForm from "@/components/booking-form"
import BookingSelector from "@/components/booking-selector"

// Helper function to convert date strings to HTML date input format (YYYY-MM-DD)
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return ""
  try {
    return new Date(dateString).toISOString().split('T')[0]
  } catch (error) {
    console.warn("Invalid date string:", dateString)
    return ""
  }
}

interface ServiceItem {
  id: string
  description: string
  unitPrice: number
  quantity: number
  total: number
  itemType: 'service' | 'part' | 'labor'
  inventoryItemId?: number
}

interface Customer {
  id: number
  name: string
  phone: string
  address: string
  email: string
}

interface Vehicle {
  id: number
  plate_number: string
  model: string
  model_name?: string
  model_category?: string
  vin_number: string
  year: number
  customer_id: number
  purchase_date?: string
  warranty_start_date?: string
  warranty_end_date?: string
  current_km?: number
  model_base_price?: string
  cc_displacement?: string
  engine_type?: string
  fuel_type?: string
  transmission?: string
  warranty_km_limit?: string
  warranty_max_services?: string
  service_count?: number
  last_service_date?: string
  total_service_amount?: string
  completed_services?: number
  pending_services?: number
}

interface InventoryItem {
  id: number
  name: string
  sku: string
  current_stock: number
  unit_price: number
  category_name: string
}

export default function NewService() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking_id')
  const customerId = searchParams.get('customer')

  const [customerType, setCustomerType] = useState<"booking" | "walking">(bookingId ? "booking" : "walking")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [searchingPlate, setSearchingPlate] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [showInventory, setShowInventory] = useState(false)
  const [staffMembers, setStaffMembers] = useState<Array<{id: number, name: string, role: string}>>([])
  const [loadingBooking, setLoadingBooking] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [createdServiceId, setCreatedServiceId] = useState<number | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showBookingSelector, setShowBookingSelector] = useState(false)
  const [showBookingActionModal, setShowBookingActionModal] = useState(false)
  const [bookingAction, setBookingAction] = useState<"existing" | "new" | null>(null)
  const [invoiceData, setInvoiceData] = useState({
    discount: 0,
    vatRate: 10, // Default 10% VAT
    discountType: 'percentage' as 'percentage' | 'fixed'
  })

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    plateNumber: "",
    model: "",
    vinNumber: "",
    year: "",
    purchaseDate: "",
    warrantyStartDate: "",
    warrantyEndDate: "",
    kilometers: "",
    serviceType: "",
    serviceDetail: "",
    paymentMethod: "cash",
    nextServiceKm: "",
    nextServiceDate: "",
    technicianId: "",
    salesRepId: "",
    notes: "",
  })



  const serviceTypes = [
    { value: "change-oil", label: "Change Oil", duration: 30, basePrice: 20 },
    { value: "checkup", label: "Check Up", duration: 60, basePrice: 50 },
    { value: "maintenance", label: "Maintenance", duration: 120, basePrice: 100 },
    { value: "repairing", label: "Repairing", duration: 180, basePrice: 150 },
  ]

  const vehicleModels = ["SOBEN", "KAIN", "KOUPREY", "KRUSAR", "KESSOR"]

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "aba", label: "ABA Bank" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
  ]

  // Load inventory items and staff on component mount
  useEffect(() => {
    loadInventoryItems()
    loadStaffMembers()
    if (bookingId) {
      loadBookingData()
    } else if (customerId) {
      loadCustomerData()
    }
  }, [bookingId, customerId])

  const loadCustomerData = async () => {
    if (!customerId) return

    setLoadingBooking(true)
    try {
      const response = await apiClient.getCustomer(customerId)
      const customer = response.data

      if (customer) {
        // Pre-fill customer information
        setFormData(prev => ({
          ...prev,
          customerName: customer.name || "",
          phone: customer.phone || "",
          address: customer.address || "",
          email: customer.email || ""
        }))

        // Set customer type to walking since we're coming from customer page
        setCustomerType("walking")

        // Load customer's vehicles
        try {
          const vehiclesResponse = await apiClient.getVehicles({ customer_id: customerId })
          const vehicles = vehiclesResponse.data || []

          if (vehicles.length > 0) {
            // Pre-select the first vehicle
            const firstVehicle = vehicles[0]
            setSelectedVehicle(firstVehicle)
            setFormData(prev => ({
              ...prev,
              plateNumber: firstVehicle.plate_number || "",
              model: firstVehicle.model_name || firstVehicle.model || "",
              year: firstVehicle.year?.toString() || "",
              vinNumber: firstVehicle.vin_number || "",
              purchaseDate: formatDateForInput(firstVehicle.purchase_date),
              warrantyStartDate: formatDateForInput(firstVehicle.warranty_start_date),
              warrantyEndDate: formatDateForInput(firstVehicle.warranty_end_date),
              kilometers: firstVehicle.current_km?.toString() || ""
            }))
          }
        } catch (vehicleError) {
          console.warn("Could not load customer vehicles:", vehicleError)
        }
      }
    } catch (error) {
      console.error("Failed to load customer data:", error)
    } finally {
      setLoadingBooking(false)
    }
  }

  const loadBookingData = async () => {
    if (!bookingId) return

    setLoadingBooking(true)
    try {
      const response = await apiClient.getBooking(Number(bookingId))
      const booking = response.data
      setBookingData(booking)

      if (booking) {
        // First, try to find existing customer and vehicle
        let existingCustomer: Customer | null = null
        let existingVehicle: Vehicle | null = null

        // Search for existing customer by phone number
        if (booking.customer_phone) {
          try {
            const customersResponse = await apiClient.getCustomers({ search: booking.customer_phone, limit: 1 })
            const customers = customersResponse?.data || []
            if (customers.length > 0) {
              existingCustomer = customers[0] as Customer

              // Search for existing vehicle by plate number for this customer
              if (booking.vehicle_plate) {
                const vehiclesResponse = await apiClient.getVehicles({ search: booking.vehicle_plate, limit: 1 })
                const vehicles = vehiclesResponse?.data || []
                const customerVehicle = vehicles.find((v: any) => v.customer_id === existingCustomer?.id)
                if (customerVehicle) {
                  existingVehicle = customerVehicle as Vehicle
                }
              }
            }
          } catch (error) {
            console.warn("Error searching for existing customer:", error)
          }
        }

        // Auto-fill form with booking data
        const updatedFormData = {
          ...formData,
          customerName: booking.customer_name || "",
          phone: booking.customer_phone || "",
          email: existingCustomer?.email || booking.customer_email || "",
          address: existingCustomer?.address || booking.customer_address || "",
          plateNumber: booking.vehicle_plate || "",
          model: booking.vehicle_model || "",
          vinNumber: existingVehicle?.vin_number || booking.vehicle_vin || "",
          year: existingVehicle?.year?.toString() || booking.vehicle_year?.toString() || "",
          serviceType: booking.service_type_name || "",
          notes: booking.notes || "",
          // Convert any date strings to proper format for HTML date inputs
          purchaseDate: formatDateForInput(booking.purchase_date),
          warrantyStartDate: formatDateForInput(booking.warranty_start_date),
          warrantyEndDate: formatDateForInput(booking.warranty_end_date),
          nextServiceDate: formatDateForInput(booking.next_service_date),
        }

        // Also add a default service item based on the service type
        if (booking.service_type_name && serviceItems.length === 0) {
          const serviceType = serviceTypes.find(s => s.label === booking.service_type_name)
          if (serviceType) {
            const defaultItem: ServiceItem = {
              id: String(Date.now()),
              description: serviceType.label,
              unitPrice: serviceType.basePrice,
              quantity: 1,
              total: serviceType.basePrice,
              itemType: 'service'
            }
            setServiceItems([defaultItem])
          }
        }

        setFormData(updatedFormData)

        if (existingCustomer && existingVehicle) {
          // Use existing customer and vehicle
          setSelectedCustomer(existingCustomer)
          setSelectedVehicle(existingVehicle)
          setCustomerType("booking")
          toast.success("Existing customer and vehicle found! Service will be linked to existing records.")
        } else if (existingCustomer) {
          // Use existing customer but create new vehicle
          setSelectedCustomer(existingCustomer)
          setSelectedVehicle({
            id: 0, // Will create new vehicle
            plate_number: booking.vehicle_plate,
            model: booking.vehicle_model,
            vin_number: booking.vehicle_vin || "",
            year: booking.vehicle_year || 0,
            customer_id: existingCustomer.id
          })
          setCustomerType("booking")
          toast.success("Existing customer found! New vehicle record will be created.")
        } else {
          // Create new customer and vehicle records
          setSelectedCustomer({
            id: 0, // Will create new customer
            name: booking.customer_name,
            phone: booking.customer_phone,
            email: booking.customer_email || "",
            address: booking.customer_address || ""
          })

          setSelectedVehicle({
            id: 0, // Will create new vehicle
            plate_number: booking.vehicle_plate,
            model: booking.vehicle_model,
            vin_number: booking.vehicle_vin || "",
            year: booking.vehicle_year || 0,
            customer_id: 0 // Will be set to new customer ID
          })

          setCustomerType("booking")
          toast.success("Booking data loaded! New customer and vehicle records will be created.")
        }
      }
    } catch (error) {
      console.error("Failed to load booking data:", error)
      toast.error("Failed to load booking data")
    } finally {
      setLoadingBooking(false)
    }
  }

  const loadInventoryItems = async () => {
    try {
      const response = await apiClient.getInventoryItems()
      setInventoryItems(response?.data || [])
    } catch (error) {
      console.error("Failed to load inventory items:", error)
    }
  }

  const loadStaffMembers = async () => {
    try {
      const response = await apiClient.getStaff()
      setStaffMembers(response?.data || [])
    } catch (error) {
      console.error("Failed to load staff members:", error)
    }
  }

  // Handle booking form submission
  const handleBookingSelect = (bookingData: any) => {
    // Auto-fill form with booking data
    const updatedFormData = {
      ...formData,
      customerName: bookingData.customer_name || "",
      phone: bookingData.customer_phone || "",
      email: bookingData.customer_email || "",
      address: bookingData.customer_address || "",
      plateNumber: bookingData.vehicle_plate || "",
      model: bookingData.vehicle_model || "",
      serviceType: bookingData.service_type_name || "",
      notes: bookingData.notes || "",
      // Convert any date strings to proper format for HTML date inputs
      purchaseDate: formatDateForInput(bookingData.purchase_date),
      warrantyStartDate: formatDateForInput(bookingData.warranty_start_date),
      warrantyEndDate: formatDateForInput(bookingData.warranty_end_date),
      nextServiceDate: formatDateForInput(bookingData.next_service_date),
    }

    setFormData(updatedFormData)
    setCustomerType("booking")
    setShowBookingForm(false)

    // Also add a default service item based on the service type
    if (bookingData.service_type_name && serviceItems.length === 0) {
      const serviceType = serviceTypes.find(s => s.label === bookingData.service_type_name)
      if (serviceType) {
        const defaultItem: ServiceItem = {
          id: String(Date.now()),
          description: serviceType.label,
          unitPrice: serviceType.basePrice,
          quantity: 1,
          total: serviceType.basePrice,
          itemType: 'service'
        }
        setServiceItems([defaultItem])
      }
    }

    toast.success("Booking created! Service form has been pre-filled with booking data.")
  }

  // Handle customer type change
  const handleCustomerTypeChange = (type: "booking" | "walking") => {
    if (type === "booking") {
      setCustomerType(type)
      setBookingAction(null) // Reset booking action
      setShowBookingActionModal(true) // Show the booking action popup
    } else {
      setCustomerType(type)
      setBookingAction(null)
      setShowBookingActionModal(false)
      // Reset form data when switching to walking customer
      setFormData({
        customerName: "",
        phone: "",
        email: "",
        address: "",
        plateNumber: "",
        model: "",
        vinNumber: "",
        year: "",
        purchaseDate: "",
        warrantyStartDate: "",
        warrantyEndDate: "",
        kilometers: "",
        serviceType: "",
        serviceDetail: "",
        paymentMethod: "cash",
        nextServiceKm: "",
        nextServiceDate: "",
        technicianId: "",
        salesRepId: "",
        notes: "",
      })
      setSelectedCustomer(null)
      setSelectedVehicle(null)
      setServiceItems([])
    }
  }

  // Handle booking action selection
  const handleBookingAction = (action: "existing" | "new") => {
    setBookingAction(action)
    setShowBookingActionModal(false) // Close the action modal

    if (action === "new") {
      // Navigate to booking form page instead of showing popup
      router.push("/bookings/new?from_service=true")
    } else {
      // For existing booking, show the booking selector popup
      setShowBookingSelector(true)
    }
  }

  // Handle existing booking selection
  const handleExistingBookingSelect = (booking: any) => {
    console.log("Booking selected:", booking)

    // Parse JSON data from booking
    let customerData: any = {}
    let vehicleData: any = {}

    try {
      customerData = typeof booking.customer_data === 'string' ? JSON.parse(booking.customer_data) : booking.customer_data || {}
      vehicleData = typeof booking.vehicle_data === 'string' ? JSON.parse(booking.vehicle_data) : booking.vehicle_data || {}
    } catch (error) {
      console.error("Error parsing booking data:", error)
    }

    console.log("Parsed customer data:", customerData)
    console.log("Parsed vehicle data:", vehicleData)

    // Auto-fill form with booking data
    const updatedFormData = {
      ...formData,
      customerName: (customerData as any).name || booking.customer_name || "",
      phone: (customerData as any).phone || booking.customer_phone || "",
      email: (customerData as any).email || booking.customer_email || "",
      address: (customerData as any).address || booking.customer_address || "",
      plateNumber: (vehicleData as any).plate_number || booking.vehicle_plate || "",
      model: (vehicleData as any).model || booking.vehicle_model || "",
      vinNumber: (vehicleData as any).vin_number || booking.vehicle_vin || "",
      year: (vehicleData as any).year?.toString() || booking.vehicle_year?.toString() || "",
      serviceType: booking.service_type_name || "",
      notes: booking.notes || "",
      // Convert any date strings to proper format for HTML date inputs
      purchaseDate: formatDateForInput((vehicleData as any).purchase_date),
      warrantyStartDate: formatDateForInput((vehicleData as any).warranty_start_date),
      warrantyEndDate: formatDateForInput((vehicleData as any).warranty_end_date),
      nextServiceDate: formatDateForInput(booking.next_service_date),
    }

    console.log("Updated form data:", updatedFormData)

    setFormData(updatedFormData)
    setBookingData(booking)
    setShowBookingSelector(false)

    // Also add a default service item based on the service type
    if (booking.service_type_name && serviceItems.length === 0) {
      // Try to find service type by name first
      let serviceType = serviceTypes.find(s => s.label === booking.service_type_name)

      // If not found, try to find by partial match
      if (!serviceType) {
        serviceType = serviceTypes.find(s =>
          s.label.toLowerCase().includes(booking.service_type_name.toLowerCase()) ||
          booking.service_type_name.toLowerCase().includes(s.label.toLowerCase())
        )
      }

      // If still not found, try to map common service types
      if (!serviceType) {
        const serviceTypeMapping: { [key: string]: string } = {
          'brake service': 'Repairing',
          'brake': 'Repairing',
          'oil change': 'Change Oil',
          'oil': 'Change Oil',
          'check up': 'Check Up',
          'checkup': 'Check Up',
          'maintenance': 'Maintenance',
          'repair': 'Repairing',
          'repairing': 'Repairing'
        }

        const mappedType = serviceTypeMapping[booking.service_type_name.toLowerCase()]
        if (mappedType) {
          serviceType = serviceTypes.find(s => s.label === mappedType)
        }
      }

      if (serviceType) {
        const defaultItem: ServiceItem = {
          id: String(Date.now()),
          description: serviceType.label,
          unitPrice: serviceType.basePrice,
          quantity: 1,
          total: serviceType.basePrice,
          itemType: 'service'
        }
        setServiceItems([defaultItem])
        console.log("Added service item:", defaultItem)
      } else {
        console.log("Service type not found:", booking.service_type_name)
        console.log("Available service types:", serviceTypes.map(s => s.label))

        // Add a generic service item if no match found
        const genericItem: ServiceItem = {
          id: String(Date.now()),
          description: booking.service_type_name || "Service",
          unitPrice: 50, // Default price
          quantity: 1,
          total: 50,
          itemType: 'service'
        }
        setServiceItems([genericItem])
        console.log("Added generic service item:", genericItem)
      }
    }

    toast.success("Existing booking selected! Service form has been pre-filled with booking data.")
  }

  // Auto-complete customer and vehicle data when plate number is entered
  const handlePlateNumberChange = async (plateNumber: string) => {
    setFormData({ ...formData, plateNumber })

    if (plateNumber.length >= 3) {
      setSearchingPlate(true)
      try {
        console.log("Searching for plate number:", plateNumber)

        // Search for vehicle by plate number
        const vehiclesResponse = await apiClient.getVehicles({ search: plateNumber, limit: 1 })
        console.log("Vehicles response:", vehiclesResponse)

        // Handle different API response structures
        let vehicle = null
        if (vehiclesResponse?.vehicles && vehiclesResponse.vehicles.length > 0) {
          vehicle = vehiclesResponse.vehicles[0]
        } else if (vehiclesResponse?.data && vehiclesResponse.data.length > 0) {
          vehicle = vehiclesResponse.data[0]
        } else if (Array.isArray(vehiclesResponse) && vehiclesResponse.length > 0) {
          vehicle = vehiclesResponse[0]
        }

        console.log("Found vehicle:", vehicle)

        if (vehicle) {
          setSelectedVehicle(vehicle)

          // Get customer data for this vehicle
          console.log("Getting customer data for customer_id:", vehicle.customer_id)
          const customerResponse = await apiClient.getCustomer(vehicle.customer_id)
          console.log("Customer response:", customerResponse)

          if (customerResponse) {
            // Extract customer data from the response structure
            const customerData = customerResponse.data || customerResponse
            console.log("Customer data extracted:", customerData)

            setSelectedCustomer(customerData)

            // Auto-fill form data
            const updatedFormData = {
              ...formData,
              plateNumber: vehicle.plate_number || plateNumber, // Keep the plate number
              customerName: customerData.name || "",
              phone: customerData.phone || "",
              email: customerData.email || "",
              address: customerData.address || "",
              model: vehicle.model || "",
              vinNumber: vehicle.vin_number || "",
              year: vehicle.year?.toString() || "",
              purchaseDate: formatDateForInput(vehicle.purchase_date),
              warrantyStartDate: formatDateForInput(vehicle.warranty_start_date),
              warrantyEndDate: formatDateForInput(vehicle.warranty_end_date),
            }

            console.log("Auto-filling form data:", updatedFormData)
            setFormData(updatedFormData)

            // Show success message for walking customers
            if (customerType === "walking") {
              toast.success(`Found existing vehicle: ${vehicle.model} (${vehicle.plate_number}) - Customer data auto-filled`)
            }
          }
        } else {
          console.log("No vehicle found for plate number:", plateNumber)
          setSelectedVehicle(null)
          setSelectedCustomer(null)

          // Show info message for walking customers
          if (customerType === "walking") {
            toast.info("No existing vehicle found - new customer and vehicle records will be created")
          }
        }
      } catch (error) {
        console.error("Error searching for vehicle:", error)
        if (customerType === "walking") {
          toast.error("Error searching for existing vehicle data")
        }
      } finally {
        setSearchingPlate(false)
      }
    }
  }

  // Auto-complete customer data when customer name is entered
  const handleCustomerNameChange = async (customerName: string) => {
    setFormData({ ...formData, customerName })

    if (customerName.length >= 3 && customerType === "walking") {
      try {
        console.log("Searching for customer by name:", customerName)

        // Search for customer by name
        const customersResponse = await apiClient.getCustomers({ search: customerName, limit: 1 })
        console.log("Customers response:", customersResponse)

        // Handle different API response structures
        let customer = null
        if (customersResponse?.customers && customersResponse.customers.length > 0) {
          customer = customersResponse.customers[0]
        } else if (customersResponse?.data && customersResponse.data.length > 0) {
          customer = customersResponse.data[0]
        } else if (Array.isArray(customersResponse) && customersResponse.length > 0) {
          customer = customersResponse[0]
        }

        console.log("Found customer:", customer)

        if (customer) {
          setSelectedCustomer(customer)

          // Auto-fill customer data
          const updatedFormData = {
            ...formData,
            customerName: customer.name || customerName,
            phone: customer.phone || "",
            email: customer.email || "",
            address: customer.address || "",
          }

          console.log("Auto-filling customer data:", updatedFormData)
          setFormData(updatedFormData)

          toast.success(`Found existing customer: ${customer.name} - Customer data auto-filled`)
        } else {
          console.log("No customer found for name:", customerName)
          setSelectedCustomer(null)
        }
      } catch (error) {
        console.error("Error searching for customer:", error)
      }
    }
  }

  // Auto-complete customer data when phone number is entered
  const handlePhoneChange = async (phone: string) => {
    setFormData({ ...formData, phone })

    if (phone.length >= 3 && customerType === "walking") {
      try {
        console.log("Searching for customer by phone:", phone)

        // Search for customer by phone
        const customersResponse = await apiClient.getCustomers({ search: phone, limit: 1 })
        console.log("Customers response:", customersResponse)

        // Handle different API response structures
        let customer = null
        if (customersResponse?.customers && customersResponse.customers.length > 0) {
          customer = customersResponse.customers[0]
        } else if (customersResponse?.data && customersResponse.data.length > 0) {
          customer = customersResponse.data[0]
        } else if (Array.isArray(customersResponse) && customersResponse.length > 0) {
          customer = customersResponse[0]
        }

        console.log("Found customer:", customer)

        if (customer) {
          setSelectedCustomer(customer)

          // Auto-fill customer data
          const updatedFormData = {
            ...formData,
            customerName: customer.name || "",
            phone: customer.phone || phone,
            email: customer.email || "",
            address: customer.address || "",
          }

          console.log("Auto-filling customer data:", updatedFormData)
          setFormData(updatedFormData)

          toast.success(`Found existing customer: ${customer.name} - Customer data auto-filled`)
        } else {
          console.log("No customer found for phone:", phone)
          setSelectedCustomer(null)
        }
      } catch (error) {
        console.error("Error searching for customer:", error)
      }
    }
  }

  // Function to handle service type selection
  const handleServiceTypeSelect = (serviceType: string) => {
    setFormData({ ...formData, serviceType })

    // Add a default service item if none exist
    if (serviceItems.length === 0) {
      const selectedService = serviceTypes.find(s => s.value === serviceType)
      if (selectedService) {
        const defaultItem: ServiceItem = {
          id: String(Date.now()),
          description: selectedService.label,
          unitPrice: selectedService.basePrice,
          quantity: 1,
          total: selectedService.basePrice,
          itemType: 'service'
        }
        setServiceItems([defaultItem])
      }
    }
  }

  const addServiceItem = () => {
    const newItem: ServiceItem = {
      id: String(Date.now()),
      description: "",
      unitPrice: 0,
      quantity: 1,
      total: 0,
      itemType: 'service'
    }
    setServiceItems((prev) => [...prev, newItem])
  }

  const addInventoryItem = (inventoryItem: InventoryItem) => {
    // Check if item has sufficient stock
    if (inventoryItem.current_stock <= 0) {
      toast.error(`${inventoryItem.name} is out of stock`)
      return
    }

    const newItem: ServiceItem = {
      id: String(Date.now()),
      description: inventoryItem.name,
      unitPrice: inventoryItem.unit_price,
      quantity: 1,
      total: inventoryItem.unit_price,
      itemType: 'part',
      inventoryItemId: inventoryItem.id
    }
    setServiceItems((prev) => [...prev, newItem])
    setShowInventory(false)
  }

  const updateServiceItem = (id: string, field: keyof ServiceItem, value: any) => {
    setServiceItems((items) =>
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === "unitPrice" || field === "quantity") {
            updated.total = (Number(updated.unitPrice) || 0) * (Number(updated.quantity) || 0)
          }
          return updated
        }
        return item
      }),
    )
  }

  const removeServiceItem = (id: string) => {
    setServiceItems((items) => items.filter((i) => i.id !== id))
  }

  const itemsTotal = useMemo(
    () => serviceItems.reduce((sum, i) => sum + (Number(i.total) || 0), 0),
    [serviceItems],
  )

  // Invoice calculations
  const invoiceCalculations = useMemo(() => {
    const subtotal = Number(itemsTotal) || 0
    const discount = Number(invoiceData.discount) || 0
    const vatRate = Number(invoiceData.vatRate) || 0

    const discountAmount = invoiceData.discountType === 'percentage'
      ? (subtotal * discount) / 100
      : discount
    const afterDiscount = subtotal - discountAmount
    const vatAmount = (afterDiscount * vatRate) / 100
    const total = afterDiscount + vatAmount

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      vatAmount,
      total
    }
  }, [itemsTotal, invoiceData])

  // Map your UI serviceType value -> expected service_types.service_type_name in DB
  const SLUG_TO_NAME: Record<string, string> = {
    "change-oil": "Oil Change", // Fixed: removed "- SOBEN" suffix
    checkup: "Basic Check Up",
    maintenance: "Preventive Maintenance",
    repairing: "Engine Service", // Fixed: changed to "Engine Service" which exists
  }

  async function findServiceTypeId(): Promise<number> {
    const wantedName = SLUG_TO_NAME[formData.serviceType] || formData.serviceType
    const res = await apiClient.getServiceTypes()
    const list: Array<{ id: number; service_type_name: string; description?: string }> = res?.data || res || []

    console.log("Available service types:", list.map(t => t.service_type_name))
    console.log("Looking for service type:", wantedName)

    // First try exact match
    let match = list.find((t) => t.service_type_name?.toLowerCase() === wantedName?.toLowerCase())

    // If no exact match, try partial match
    if (!match) {
      match = list.find((t) => t.service_type_name?.toLowerCase().includes(wantedName?.toLowerCase()))
    }

    // If still no match, try reverse partial match (wanted name contains service type)
    if (!match) {
      match = list.find((t) => wantedName?.toLowerCase().includes(t.service_type_name?.toLowerCase()))
    }

    if (!match) {
      const availableTypes = list.map(t => t.service_type_name).filter(Boolean).join(", ")
      throw new Error(`Service type "${wantedName || "(not selected)"}" not found. Available types: ${availableTypes}`)
    }

    console.log("Found service type:", match.service_type_name, "with ID:", match.id)
    return match.id
  }

  async function findOrCreateCustomer(): Promise<{ id: number | string; name: string }> {
    const name = (formData.customerName || "").trim()
    const phone = (formData.phone || "").trim()

    if (!name || !phone) {
      throw new Error("Customer name and phone are required")
    }

    // If we have a selected customer with an ID, use it (existing customer)
    if (selectedCustomer && selectedCustomer.id && selectedCustomer.id !== 0) {
      return { id: selectedCustomer.id, name: selectedCustomer.name }
    }

    // Try to find existing customer by phone number
    try {
      const customersResponse = await apiClient.getCustomers({ search: phone, limit: 1 })
      const customers = customersResponse?.data || []
      const existingCustomer = customers.find((c: any) => c.phone === phone)

      if (existingCustomer) {
        return { id: existingCustomer.id, name: existingCustomer.name }
      }
    } catch (error) {
      console.warn("Error searching for existing customer:", error)
    }

    // Create new customer if none exists
    const customerData = {
      name,
      phone,
      email: (formData.email || "").trim() || null,
      address: (formData.address || "").trim() || null,
    }

    const res = await apiClient.createCustomer(customerData)
    return { id: res?.data?.id ?? res?.id, name }
  }

  async function findOrCreateVehicle(customerId: number | string): Promise<number | string> {
    if (!formData.plateNumber || !formData.model) {
      throw new Error("Vehicle plate number and model are required")
    }

    // If we have a selected vehicle with an ID, use it (existing vehicle)
    if (selectedVehicle && selectedVehicle.id && selectedVehicle.id !== 0) {
      console.log("Using selected existing vehicle:", selectedVehicle)
      return selectedVehicle.id
    }

    // Try to find existing vehicle by plate number
    try {
      console.log("=== VEHICLE SEARCH DEBUG ===")
      console.log("Searching for existing vehicle with plate:", formData.plateNumber)
      console.log("Customer ID:", customerId)

      const vehiclesResponse = await apiClient.getVehicles({ search: formData.plateNumber, limit: 50 })

      console.log("Raw API Response:", vehiclesResponse)
      console.log("Response type:", typeof vehiclesResponse)
      console.log("Response keys:", vehiclesResponse ? Object.keys(vehiclesResponse) : 'No response')

      // Handle different API response structures
      let vehicles: any[] = []
      if (vehiclesResponse?.vehicles) {
        // API returns { vehicles: [...], pagination: {...} }
        vehicles = vehiclesResponse.vehicles
        console.log("Using vehiclesResponse.vehicles")
      } else if (vehiclesResponse?.data) {
        // API returns { data: [...] }
        vehicles = vehiclesResponse.data
        console.log("Using vehiclesResponse.data")
      } else if (Array.isArray(vehiclesResponse)) {
        // API returns direct array
        vehicles = vehiclesResponse
        console.log("Using vehiclesResponse as direct array")
      } else {
        console.log("No valid vehicles array found in response")
      }

      console.log("Extracted vehicles array:", vehicles)
      console.log("Vehicles array length:", vehicles.length)

      // Find vehicles with matching plate number
      const matchingVehicles = vehicles.filter((v: any) => {
        console.log("Checking vehicle:", v.plate_number, "against:", formData.plateNumber)
        const matches = v.plate_number === formData.plateNumber
        console.log("Match result:", matches)
        return matches
      })

      console.log("Found matching vehicles:", matchingVehicles.length)

      if (matchingVehicles.length > 0) {
        // Find the best match - prioritize vehicles for the same customer
        let bestVehicle = matchingVehicles[0]

        // First, try to find a vehicle for the same customer
        const sameCustomerVehicle = matchingVehicles.find(v => v.customer_id === Number(customerId))
        if (sameCustomerVehicle) {
          bestVehicle = sameCustomerVehicle
          console.log("Found vehicle for same customer:", bestVehicle)
        } else {
          // If no vehicle for same customer, use the most recent one
          bestVehicle = matchingVehicles.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          console.log("Using most recent vehicle:", bestVehicle)
        }

        // Check if it belongs to the same customer
        if (bestVehicle.customer_id === Number(customerId)) {
          console.log("Vehicle belongs to same customer, using existing vehicle")
          toast.success(`Using existing vehicle: ${bestVehicle.model} (${bestVehicle.plate_number})`)
          return bestVehicle.id
        } else {
          // Vehicle exists but belongs to different customer
          console.log("Vehicle exists but belongs to different customer")
          console.log("Vehicle customer_id:", bestVehicle.customer_id, "vs current customer_id:", customerId)

          // Since we allow duplicate plate numbers, we can create a new vehicle for this customer
          console.log("Creating new vehicle for different customer with same plate number")
        }
      } else {
        console.log("No existing vehicle found with plate:", formData.plateNumber)
        console.log("Searched through vehicles:", vehicles.map(v => ({ id: v.id, plate: v.plate_number, customer: v.customer_id })))
      }
    } catch (error) {
      console.warn("Error searching for existing vehicle:", error)
      // Don't throw here, continue to create new vehicle
    }

    // Create new vehicle if none exists or if we need one for a different customer
    console.log("Creating new vehicle for customer:", customerId)
    try {
      const created = await apiClient.createVehicle({
        customer_id: customerId,
        plate_number: formData.plateNumber,
        model: formData.model,
        vin_number: formData.vinNumber || null,
        year: formData.year ? Number(formData.year) : null,
        purchase_date: formData.purchaseDate || null,
        warranty_start_date: formData.warrantyStartDate || null,
        warranty_end_date: formData.warrantyEndDate || null,
      })

      const vehicleId = created?.data?.id ?? created?.id ?? created?.vehicle?.id
      console.log("New vehicle created with ID:", vehicleId)
      toast.success(`New vehicle created: ${formData.model} (${formData.plateNumber})`)
      return vehicleId
    } catch (error: any) {
      console.error("Failed to create vehicle:", error)
      throw new Error(`Failed to create vehicle: ${error?.message || "Unknown error"}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      // Basic validations
      if (!formData.serviceType) throw new Error("Please select a service type")
      if (!formData.serviceDetail) throw new Error("Please provide service details")
      if (!formData.plateNumber || !formData.model) throw new Error("Please fill vehicle information")
      if (!formData.customerName || !formData.phone) throw new Error("Please fill customer information")

      // Validate service items have descriptions
      const invalidItems = serviceItems.filter(item => !item.description.trim())
      if (invalidItems.length > 0) {
        throw new Error("All service items must have descriptions")
      }

      // 1) Find service_type_id
      const serviceTypeId = await findServiceTypeId()

      // 2) Find/Create customer
      const customer = await findOrCreateCustomer()

      // 3) Find/Create vehicle
      const vehicleId = await findOrCreateVehicle(customer.id)

      // 4) Create service with all required fields
      const totalAmount = itemsTotal > 0 ? itemsTotal : 0
             const payload = {
         customer_id: Number(customer.id),
         vehicle_id: Number(vehicleId),
         service_type_id: Number(serviceTypeId),
         service_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
         current_km: formData.kilometers ? Number(formData.kilometers) : null,
         next_service_km: formData.nextServiceKm ? Number(formData.nextServiceKm) : null,
         next_service_date: formData.nextServiceDate || null,
         total_amount: totalAmount,
         payment_method: formData.paymentMethod,
         service_status: "pending",
         payment_status: "pending",
         technician_id: formData.technicianId ? Number(formData.technicianId) : null,
         sales_rep_id: formData.salesRepId ? Number(formData.salesRepId) : null,
         notes: formData.notes || null,
         service_detail: formData.serviceDetail || null,
         customer_type: customerType,
         booking_id: bookingId ? Number(bookingId) : null,
       }

      const created = await apiClient.createService(payload)

      // 5) If we have service items, save them
      if (serviceItems.length > 0 && created?.data?.id) {
        try {
          await saveServiceItems(created.data.id, serviceItems)
        } catch (itemError) {
          console.warn("Failed to save service items:", itemError)
          // Don't fail the whole request if items fail to save
        }
      }

      setSuccessMsg("Service created successfully!")
      setCreatedServiceId(created?.data?.id)
      setShowInvoiceModal(true)
    } catch (err: any) {
      console.error("[new-service] submit failed:", err)
      setError(err?.message || "Failed to create service")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to save service items
  async function saveServiceItems(serviceId: number, items: ServiceItem[]) {
    const itemsPayload = items.map(item => ({
      service_id: serviceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.total,
      item_type: item.itemType
    }))

    // Call the API to save service items
    await apiClient.createServiceItems(itemsPayload)

    // Record stock movements for inventory items
    const inventoryItems = items.filter(item => item.itemType === 'part' && item.inventoryItemId)

    for (const item of inventoryItems) {
      try {
        await apiClient.recordStockMovement({
          item_id: item.inventoryItemId!,
          movement_type: 'out',
          quantity: item.quantity,
          reference_type: 'service',
          reference_id: serviceId,
          notes: `Used in service #${serviceId}`
        })
      } catch (error) {
        console.warn(`Failed to record stock movement for item ${item.inventoryItemId}:`, error)
        // Don't fail the whole request if stock movement fails
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">New Service</h1>
              {loadingBooking && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading booking data...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Feedback messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {successMsg}
            </div>
          )}

          {/* Customer Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Type</CardTitle>
              <CardDescription>Select whether this is a booking or walking customer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={customerType === "booking" ? "default" : "outline"}
                  onClick={() => handleCustomerTypeChange("booking")}
                >
                  Booking Customer
                </Button>
                <Button
                  type="button"
                  variant={customerType === "walking" ? "default" : "outline"}
                  onClick={() => handleCustomerTypeChange("walking")}
                >
                  Walking Customer
                </Button>
              </div>

              {/* Booking Customer Status */}
              {customerType === "booking" && bookingAction && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Booking Customer Selected</h4>
                  <p className="text-sm text-blue-700">
                    {bookingAction === "existing"
                      ? "✓ Existing booking selected - service form will be pre-filled"
                      : bookingAction === "new"
                      ? "✓ New booking created - service form will be pre-filled"
                      : "Choose an action to proceed"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Information - Start with plate number for auto-complete */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="h-4 w-4 mr-2" />
                Vehicle Information
              </CardTitle>
              <CardDescription>
                {customerType === "walking"
                  ? "Enter plate number, customer name, or phone number to auto-complete existing customer data"
                  : "Enter vehicle plate number to auto-complete customer and vehicle data"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehicle Status Display */}
              {selectedVehicle && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Vehicle Auto-Loaded</h4>
                      <p className="text-sm text-blue-700">Existing vehicle data has been populated</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-white p-2 rounded border">
                      <span className="text-gray-600">Model:</span>
                      <div className="font-medium">{selectedVehicle.model_name || selectedVehicle.model}</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-gray-600">Category:</span>
                      <div className="font-medium">{selectedVehicle.model_category}</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-gray-600">Engine:</span>
                      <div className="font-medium">{selectedVehicle.engine_type}</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-gray-600">Services:</span>
                      <div className="font-medium">{selectedVehicle.service_count} completed</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plateNumber">Plate Number *</Label>
                  <div className="relative">
                    <Input
                      id="plateNumber"
                      value={formData.plateNumber}
                      onChange={(e) => handlePlateNumberChange(e.target.value)}
                      placeholder="2CD-7960"
                      required
                      className={selectedVehicle ? "bg-green-50 border-green-300" : ""}
                    />
                    {searchingPlate && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  {selectedVehicle && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      ✓ Auto-completed: Found existing vehicle "{selectedVehicle.model_name || selectedVehicle.model}" ({selectedVehicle.plate_number})
                      <br />
                      <span className="text-xs text-green-600">
                        Vehicle and customer data have been automatically filled
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Select
                    value={formData.model}
                    onValueChange={(value) => setFormData({ ...formData, model: value })}
                  >
                    <SelectTrigger className={selectedVehicle ? "bg-green-50 border-green-300" : ""}>
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
                  <Label htmlFor="vinNumber">VIN Number</Label>
                  <Input
                    id="vinNumber"
                    value={formData.vinNumber}
                    onChange={(e) => setFormData({ ...formData, vinNumber: e.target.value })}
                    placeholder="LUYJB2G27SA009637"
                    className={selectedVehicle ? "bg-green-50 border-green-300" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2023"
                    className={selectedVehicle ? "bg-green-50 border-green-300" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className={selectedVehicle ? "bg-green-50 border-green-300" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="warrantyStartDate">Warranty Start Date</Label>
                  <Input
                    id="warrantyStartDate"
                    type="date"
                    value={formData.warrantyStartDate}
                    onChange={(e) => setFormData({ ...formData, warrantyStartDate: e.target.value })}
                    className={selectedVehicle ? "bg-green-50 border-green-300" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="warrantyEndDate">Warranty End Date</Label>
                  <Input
                    id="warrantyEndDate"
                    type="date"
                    value={formData.warrantyEndDate}
                    onChange={(e) => setFormData({ ...formData, warrantyEndDate: e.target.value })}
                    className={selectedVehicle ? "bg-green-50 border-green-300" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="kilometers">Current Kilometers</Label>
                  <Input
                    id="kilometers"
                    type="number"
                    value={formData.kilometers}
                    onChange={(e) => setFormData({ ...formData, kilometers: e.target.value })}
                    placeholder="15000"
                    className={selectedVehicle ? "bg-green-50 border-green-300" : ""}
                  />
                </div>
              </div>

              {/* Additional Vehicle Information */}
              {selectedVehicle && (
                <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    Additional Vehicle Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Base Price:</span>
                      <div className="font-medium">${selectedVehicle.model_base_price}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Displacement:</span>
                      <div className="font-medium">{selectedVehicle.cc_displacement}cc</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Fuel Type:</span>
                      <div className="font-medium">{selectedVehicle.fuel_type}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Transmission:</span>
                      <div className="font-medium">{selectedVehicle.transmission}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Warranty Limit:</span>
                      <div className="font-medium">{selectedVehicle.warranty_km_limit} km</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Max Services:</span>
                      <div className="font-medium">{selectedVehicle.warranty_max_services}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Customer Information
              </CardTitle>
              <CardDescription>
                {customerType === "walking"
                  ? "Enter customer name or phone number to auto-complete existing customer data"
                  : selectedCustomer
                    ? "Customer data auto-filled from existing record (new record will be created)"
                    : "Enter customer details"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                                           {selectedCustomer && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✓ Auto-completed: Found existing customer "{selectedCustomer.name}" ({selectedCustomer.phone})
                  <br />
                  <span className="text-xs text-green-600">
                    Customer data has been automatically filled from the database (new record will be created)
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                    placeholder="Enter customer name for auto-complete"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Enter phone number for auto-complete"
                    required
                  />
                </div>
                                 <div>
                   <Label htmlFor="email">Email</Label>
                   <Input
                     id="email"
                     type="email"
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                     placeholder="customer@example.com"
                   />
                 </div>
                 <div>
                   <Label htmlFor="address">Address</Label>
                   <Input
                     id="address"
                     value={formData.address}
                     onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                   />
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Type */}
          <Card>
            <CardHeader>
              <CardTitle>Service Type</CardTitle>
              <CardDescription>Select the main service category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {serviceTypes.map((service) => (
                  <div
                    key={service.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.serviceType === service.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleServiceTypeSelect(service.value)}
                  >
                    <h3 className="font-medium">{service.label}</h3>
                    <p className="text-sm text-gray-500">{service.duration} minutes</p>
                    <p className="text-sm font-medium text-green-600">From ${service.basePrice}</p>
                  </div>
                ))}
              </div>

              {/* Service Detail - Only show when service type is selected */}
              {formData.serviceType && (
                <div className="mt-6">
                  <Label htmlFor="serviceDetail">Service Detail *</Label>
                  <Textarea
                    id="serviceDetail"
                    value={formData.serviceDetail}
                    onChange={(e) => setFormData({ ...formData, serviceDetail: e.target.value })}
                    placeholder="Describe the specific service details..."
                    rows={3}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Provide detailed information about the service to be performed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

                               {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select how the customer will pay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === method.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                  >
                    <h3 className="font-medium">{method.label}</h3>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

                     {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>Additional service information and scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nextServiceKm">Next Service Kilometers</Label>
                  <Input
                    id="nextServiceKm"
                    type="number"
                    value={formData.nextServiceKm}
                    onChange={(e) => setFormData({ ...formData, nextServiceKm: e.target.value })}
                    placeholder="20000"
                  />
                </div>
                <div>
                  <Label htmlFor="nextServiceDate">Next Service Date</Label>
                  <Input
                    id="nextServiceDate"
                    type="date"
                    value={formData.nextServiceDate}
                    onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="technicianId">Technician</Label>
                  <Select
                    value={formData.technicianId}
                    onValueChange={(value) => setFormData({ ...formData, technicianId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.filter(staff => staff.role === 'technician').map((staff) => (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="salesRepId">Sales Representative</Label>
                  <Select
                    value={formData.salesRepId}
                    onValueChange={(value) => setFormData({ ...formData, salesRepId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales rep" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.filter(staff => staff.role === 'service_advisor' || staff.role === 'manager').map((staff) => (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Service Items</CardTitle>
                  <CardDescription>Add specific services, parts, and labor</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button type="button" onClick={() => setShowInventory(!showInventory)}>
                    <Package className="h-4 w-4 mr-2" />
                    Add Parts
                  </Button>
                  <Button type="button" onClick={addServiceItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Inventory Selection */}
              {showInventory && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3">Select Parts from Inventory</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {inventoryItems.map((item) => {
                      const isOutOfStock = item.current_stock <= 0
                      const isLowStock = item.current_stock <= 5

                      return (
                        <div
                          key={item.id}
                          className={`p-3 border rounded transition-colors ${
                            isOutOfStock
                              ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-60'
                              : isLowStock
                                ? 'bg-yellow-50 border-yellow-200 cursor-pointer hover:bg-yellow-100'
                                : 'bg-white cursor-pointer hover:bg-blue-50'
                          }`}
                          onClick={() => !isOutOfStock && addInventoryItem(item)}
                        >
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                          <div className={`text-xs ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-500'}`}>
                            Stock: {item.current_stock}
                            {isOutOfStock && ' (Out of Stock)'}
                            {isLowStock && !isOutOfStock && ' (Low Stock)'}
                          </div>
                          <div className="text-sm font-medium text-green-600">${item.unit_price}</div>
                        </div>
                      )
                    })}
                  </div>
                  {inventoryItems.length === 0 && (
                    <p className="text-sm text-gray-500">No inventory items available</p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {serviceItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Input
                        placeholder="Service description"
                        value={item.description}
                        onChange={(e) => updateServiceItem(item.id, "description", e.target.value)}
                      />
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-gray-500">Type:</span>
                        <Select
                          value={item.itemType}
                          onValueChange={(value) => updateServiceItem(item.id, "itemType", value)}
                        >
                          <SelectTrigger className="w-24 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="part">Part</SelectItem>
                            <SelectItem value="labor">Labor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateServiceItem(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateServiceItem(item.id, "quantity", Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-24 text-right font-medium">${(Number(item.total) || 0).toFixed(2)}</div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeServiceItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {serviceItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No service items added yet. Click "Add Service" or "Add Parts" to get started.
                  </div>
                )}

                {serviceItems.length > 0 && (
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-right">
                      <p className="text-lg font-bold">Total: ${(Number(itemsTotal) || 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Description</CardTitle>
              <CardDescription>Any special instructions or observations</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any additional description..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Link href="/">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Service…
                </>
              ) : (
                "Create Service"
              )}
            </Button>
          </div>
        </form>
      </main>

      {/* Generate Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[95vh] overflow-hidden">
            <Card className="border-0 shadow-2xl bg-white">
              <CardHeader className="bg-gray-800 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Generate Invoice</CardTitle>
                      <CardDescription className="text-blue-100">
                        Review and customize the invoice details before generating
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowInvoiceModal(false)
                      router.push("/services")
                    }}
                    className="text-white hover:bg-white/20 rounded-full p-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[80vh] overflow-y-auto">
                  <div className="p-6 space-y-8">
                    {/* Invoice Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Service Details Card */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center text-lg">
                            <User className="h-5 w-5 mr-2 text-blue-600" />
                            Service Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Customer</p>
                                <p className="font-semibold">{formData.customerName}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Phone</p>
                                <p className="font-semibold">{formData.phone}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Vehicle</p>
                                <p className="font-semibold">{formData.model} ({formData.plateNumber})</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Service Type</p>
                                <p className="font-semibold">{serviceTypes.find(s => s.value === formData.serviceType)?.label}</p>
                              </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                              <p className="text-sm font-medium text-gray-600 mb-2">Service Detail</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{formData.serviceDetail}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Invoice Settings Card */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center text-lg">
                            <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                            Invoice Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Discount Settings */}
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="discountType" className="text-sm font-semibold text-gray-700">Discount Type</Label>
                              <Select
                                value={invoiceData.discountType}
                                onValueChange={(value: 'percentage' | 'fixed') =>
                                  setInvoiceData({...invoiceData, discountType: value})
                                }
                              >
                                <SelectTrigger className="mt-2 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="discount" className="text-sm font-semibold text-gray-700">
                                Discount {invoiceData.discountType === 'percentage' ? '(%)' : '($)'}
                              </Label>
                              <Input
                                id="discount"
                                type="number"
                                value={invoiceData.discount}
                                onChange={(e) => setInvoiceData({...invoiceData, discount: Number(e.target.value) || 0})}
                                placeholder={invoiceData.discountType === 'percentage' ? '10' : '50'}
                                className="mt-2 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="vatRate" className="text-sm font-semibold text-gray-700">VAT Rate (%)</Label>
                              <Input
                                id="vatRate"
                                type="number"
                                value={invoiceData.vatRate}
                                onChange={(e) => setInvoiceData({...invoiceData, vatRate: Number(e.target.value) || 0})}
                                placeholder="10"
                                className="mt-2 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Service Items */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <CardTitle className="flex items-center text-lg">
                          <Package className="h-5 w-5 mr-2 text-blue-600" />
                          Service Items
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-800 text-white">
                                <tr>
                                  <th className="text-left p-4 font-semibold">Description</th>
                                  <th className="text-right p-4 font-semibold">Unit Price</th>
                                  <th className="text-center p-4 font-semibold">Quantity</th>
                                  <th className="text-right p-4 font-semibold">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {serviceItems.map((item, index) => (
                                  <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                    <td className="p-4">
                                      <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full ${
                                          item.itemType === 'service' ? 'bg-blue-500' :
                                          item.itemType === 'part' ? 'bg-green-500' : 'bg-purple-500'
                                        }`}></div>
                                        <span className="font-medium text-gray-900">{item.description}</span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                          item.itemType === 'service' ? 'bg-blue-100 text-blue-800' :
                                          item.itemType === 'part' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                                        }`}>
                                          {item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-4 text-right font-semibold text-gray-900">${(Number(item.unitPrice) || 0).toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-sm font-semibold">
                                        {item.quantity}
                                      </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900">${(Number(item.total) || 0).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Invoice Summary */}
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-lg">
                          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                          Invoice Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-3 px-4 bg-white rounded-lg shadow-sm">
                            <span className="font-medium text-gray-700">Subtotal</span>
                            <span className="font-semibold text-gray-900">${invoiceCalculations.subtotal.toFixed(2)}</span>
                          </div>

                          {invoiceCalculations.discountAmount > 0 && (
                            <div className="flex justify-between items-center py-3 px-4 bg-green-100 rounded-lg shadow-sm border border-green-200">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-green-800">Discount</span>
                                <span className="text-sm text-green-600">
                                  ({invoiceData.discountType === 'percentage' ? `${invoiceData.discount}%` : `$${invoiceData.discount}`})
                                </span>
                              </div>
                              <span className="font-bold text-green-800">-${invoiceCalculations.discountAmount.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center py-3 px-4 bg-white rounded-lg shadow-sm">
                            <span className="font-medium text-gray-700">After Discount</span>
                            <span className="font-semibold text-gray-900">${invoiceCalculations.afterDiscount.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center py-3 px-4 bg-white rounded-lg shadow-sm">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-700">VAT</span>
                              <span className="text-sm text-gray-500">({invoiceData.vatRate}%)</span>
                            </div>
                            <span className="font-semibold text-gray-900">${invoiceCalculations.vatAmount.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-lg">
                            <span className="text-xl font-bold">Total Amount</span>
                            <span className="text-2xl font-bold">${invoiceCalculations.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setShowInvoiceModal(false)
                          router.push("/services")
                        }}
                        className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Skip Invoice
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => {
                          // Here you would typically generate and download/print the invoice
                          // For now, we'll just close the modal and redirect
                          setShowInvoiceModal(false)
                          router.push(`/services/${createdServiceId}`)
                        }}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Generate Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          onBookingSelect={handleBookingSelect}
          onClose={() => setShowBookingForm(false)}
        />
      )}

      {/* Booking Selector Modal */}
      {showBookingSelector && (
        <BookingSelector
          onBookingSelect={handleExistingBookingSelect}
          onClose={() => setShowBookingSelector(false)}
        />
      )}

      {/* Booking Action Modal */}
      {showBookingActionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg">
            <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden">
              {/* Modern Black Header */}
              <CardHeader className="bg-gradient-to-r from-gray-900 to-black text-white p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <User className="h-7 w-7" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold tracking-tight">Booking Customer</CardTitle>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBookingActionModal(false)
                      setCustomerType("walking") // Reset to walking if cancelled
                    }}
                    className="text-white hover:bg-white/10 rounded-xl p-3 transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Description */}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <Button
                      onClick={() => handleBookingAction("existing")}
                      className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Search className="h-6 w-6" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-lg">Already Booking</div>
                          <div className="text-sm opacity-90">Select from existing bookings</div>
                        </div>
                        <div className="p-1 bg-white/20 rounded-full">
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => handleBookingAction("new")}
                      className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Plus className="h-6 w-6" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-lg">New Booking</div>
                          <div className="text-sm opacity-90">Create a new booking first</div>
                        </div>
                        <div className="p-1 bg-white/20 rounded-full">
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </div>
                      </div>
                    </Button>
                  </div>

                  {/* Cancel Button */}
                  <div className="pt-6 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowBookingActionModal(false)
                        setCustomerType("walking") // Reset to walking if cancelled
                      }}
                      className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Cancel - Switch to Walking Customer</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
