"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react"
import { generateInvoicePDF, InvoiceData } from "@/lib/pdf-generator"
import { useLanguage } from "@/lib/language-context"
import { apiClient } from "@/lib/api-client"

interface ServiceInvoice {
  id: number
  invoice_number: string
  service_date: string
  current_km: number
  total_amount: number
  payment_method: string
  notes: string
  customer_name: string
  customer_phone: string
  customer_address: string
  vehicle_plate: string
  vehicle_model: string
  vehicle_year: number
  vehicle_vin_number: string
  service_type_name: string
  service_items: Array<{
    id: number
    description: string
    quantity: number
    unit_price: number
    total_price: number
    item_type: string
  }>
}

export default function ServiceInvoicePage() {
  const params = useParams()
  const printRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const [service, setService] = useState<ServiceInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const serviceId = params.id as string

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true)

        // Try to get invoice data first
        let response
        try {
          response = await apiClient.getServiceInvoice(serviceId)
        } catch (invoiceError) {
          console.log("Invoice endpoint not available, falling back to service data")
          // Fallback: get service data and create invoice structure
          response = await apiClient.getService(serviceId)

          // Create invoice structure from service data
          const serviceData = response.data || response
          response = {
            data: {
              service: serviceData,
              invoice: {
                items: [
                  {
                    id: 1,
                    description: serviceData.service_type_name || 'Service',
                    quantity: 1,
                    unit_price: serviceData.total_amount,
                    total: serviceData.total_amount,
                    item_type: 'service'
                  }
                ],
                subtotal: serviceData.total_amount,
                vat_rate: 10,
                vat_amount: Math.round(serviceData.total_amount * 0.1 * 100) / 100,
                total: Math.round(serviceData.total_amount * 1.1 * 100) / 100
              }
            }
          }
        }

        // Extract service data from the invoice response
        const serviceData = response.data?.service || response.data
        const invoiceData = response.data?.invoice

        // Map invoice items to service_items format
        if (invoiceData?.items) {
          serviceData.service_items = invoiceData.items.map((item: any, index: number) => ({
            id: index + 1,
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.unit_price,
            total_price: item.total || item.total_price,
            item_type: item.item_type || 'service'
          }))
        }

        setService(serviceData as ServiceInvoice)
        setError(null)
      } catch (err: any) {
        console.error("Failed to fetch service invoice:", err)
        setError(err?.message || "Failed to fetch service invoice")
      } finally {
        setLoading(false)
      }
    }

    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML
      const originalContent = document.body.innerHTML
      document.body.innerHTML = printContent
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }
  }

  const handleDownload = () => {
    if (!service) return

    // Convert service data to InvoiceData format
    const invoiceData: InvoiceData = {
      serviceId: service.id,
      invoiceNumber: service.invoice_number,
      serviceDate: service.service_date,
      serviceType: service.service_type_name,
      serviceDetail: service.notes || 'Service performed',

      // Customer Information
      customerName: service.customer_name,
      customerPhone: service.customer_phone,
      customerEmail: service.customer_email || '',
      customerAddress: service.customer_address || '',

      // Vehicle Information
      vehiclePlate: service.vehicle_plate,
      vehicleModel: service.vehicle_model,
      vehicleYear: service.vehicle_year,
      vehicleVin: service.vehicle_vin_number,

      // Service Items
      serviceItems: service.service_items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        itemType: item.item_type
      })),

      // Pricing
      subtotal: service.total_amount,
      discountAmount: 0, // You can add discount logic here
      vatRate: 10, // Default VAT rate
      vatAmount: Math.round(service.total_amount * 0.1 * 100) / 100,
      totalAmount: Math.round(service.total_amount * 1.1 * 100) / 100,

      // Payment Information
      paymentMethod: service.payment_method,
      paymentStatus: 'pending', // You can get this from service data

      // Additional Information
      notes: service.notes
    }

    // Generate and download PDF
    generateInvoicePDF(invoiceData)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('common.loading', 'Loading invoice...')}</p>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">{t('common.error', 'Error')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error || t('common.service_not_found', 'Service not found')}</p>
            <Link href="/services">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('invoice.back', 'Back to Services')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 print:hidden transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href={`/services/${service.id}`} className="mr-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('invoice.back', 'Back to Service')}
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('invoice.title', 'Invoice')} {service.invoice_number}</h1>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('invoice.download_pdf', 'Download PDF')}
              </Button>
              <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
                <Printer className="h-4 w-4 mr-2" />
                {t('invoice.print', 'Print')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          ref={printRef}
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-colors duration-200"
        >
          {/* Invoice Header */}
          <div className="bg-white dark:bg-gray-800 p-6 border-b-2 border-gray-300 dark:border-gray-600 relative">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {/* GTV Motor Logo */}
                  <img
                    src="/Logo GTV Motor eng&kh.png"
                    alt="GTV Motor Logo"
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <div className="flex items-center">
                  {/* GTV Slogan Logo */}
                  <img
                    src="/Slogan GTV.png"
                    alt="GTV Slogan"
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </div>

            {/* Invoice Title */}
            <div className="text-center mt-6">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">វិក្កយបត្រ</h1>
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">INVOICE</h2>
            </div>
          </div>

          {/* Invoice Details and Customer Information */}
          <div className="p-6 bg-white dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Information - Left Side */}
              <div>
                <div className="text-sm">
                  <div className="mb-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">ឈ្មោះអតិថិជន/Customer Name:</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{service.customer_name}</span>
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">អាសយដ្ឋាន/Address:</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{service.customer_address || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">លេខទូរស័ព្ទ/ Tel:</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{service.customer_phone}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Details - Right Side */}
              <div>
                <div className="text-sm text-right">
                  <div className="mb-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">លេខវិក្កយបត្រ /Invoice:</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{service.invoice_number}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">កាលបរិច្ឆេទ / Date:</span>
                    <span className="ml-2 text-gray-700 dark:text-gray-300">{service.service_date ? new Date(service.service_date).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Items Table */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                      N°
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                      បរិយាយមុខទំនិញ/សេវា
                      <br />
                      (Description of Goods/Services)
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                      បរិមាណ
                      <br />
                      (Quantity)
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                      តម្លៃឯកតា
                      <br />
                      (Unit Price)
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                      ថ្លៃទំនិញ/សេវា
                      <br />
                      (Amount)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {service.service_items?.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-gray-600">
                      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{index + 1}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.description}</td>
                      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                        ${(Number(item.unit_price) || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                        ${(Number(item.total_price) || 0).toFixed(2)}
                      </td>
                    </tr>
                  )) || (
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No service items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mb-6">
              <div className="w-80">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                    <span className="text-gray-700 dark:text-gray-300">${((Number(service.total_amount) || 0) / 1.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">VAT 10%:</span>
                    <span className="text-gray-700 dark:text-gray-300">${((Number(service.total_amount) || 0) * 0.1 / 1.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-400 dark:border-gray-600">
                    <span className="font-bold text-gray-900 dark:text-gray-100">Total (including VAT 10% in USD):</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">${(Number(service.total_amount) || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Vehicle Information */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">កំណត់សម្គាល់/Note:</h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">ស្លាកលេខ/Plate No:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{service.vehicle_plate}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">ម៉ាករថយន្ត/Model:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{service.vehicle_model}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">លេខតួរថយន្ត/VIN No:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{service.vehicle_vin_number || "—"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">គីឡូម៉ែត្រ/Kilometers:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{service.current_km?.toLocaleString() || "—"}km</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <div className="text-center">
                <div className="border-t border-gray-400 dark:border-gray-600 pt-2 mt-16">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">ហត្ថលេខា និងឈ្មោះអ្នកទិញ</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer's Signature & Name</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 dark:border-gray-600 pt-2 mt-16">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">ហត្ថលេខា និងឈ្មោះអ្នកលក់</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Seller's Signature & Name</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

