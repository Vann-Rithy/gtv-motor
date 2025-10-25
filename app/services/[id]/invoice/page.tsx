"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useLanguage } from "@/lib/language-context"

interface ServiceInvoice {
  id: number
  invoice_number: string
  service_date: string
  current_km: number
  volume_l?: number
  total_amount: number
  exchange_rate?: number
  total_khr?: number
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
    // In a real app, generate PDF here
    alert("PDF download functionality would be implemented here")
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
          <div className="bg-white dark:bg-gray-800 p-8 border-b-2 border-gray-300 dark:border-gray-600 relative">
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
          <div className="text-center mt-6 sm:mt-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200">វិក្កយបត្រ</h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300">INVOICE</h2>
          </div>
        </div>

          {/* Invoice Details and Customer Information */}
          <div className="p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
              {/* Customer Information - Left Side */}
              <div>
                <div className="text-sm sm:text-base">
                  <div className="mb-1 sm:mb-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">ឈ្មោះអតិថិជន/Customer Name:</span>
                    <span className="ml-1 sm:ml-2 text-gray-700 dark:text-gray-300">{service.customer_name}</span>
                  </div>
                  <div className="mb-1 sm:mb-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">អាសយដ្ឋាន/Address:</span>
                    <span className="ml-1 sm:ml-2 text-gray-700 dark:text-gray-300">{service.customer_address || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">លេខទូរស័ព្ទ/ Tel:</span>
                    <span className="ml-1 sm:ml-2 text-gray-700 dark:text-gray-300">{service.customer_phone}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Details - Right Side */}
              <div>
                <div className="text-sm sm:text-base text-right">
                  <div className="mb-1 sm:mb-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">លេខវិក្កយបត្រ Invoice No.:</span>
                    <span className="ml-1 sm:ml-2 text-gray-700 dark:text-gray-300">{service.invoice_number}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">កាលបរិច្ឆេទ / Date:</span>
                    <span className="ml-1 sm:ml-2 text-gray-700 dark:text-gray-300">{service.service_date ? new Date(service.service_date).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Items Table */}
            <div className="border border-gray-300 dark:border-gray-600 overflow-hidden mb-6 sm:mb-8">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                      N°
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs sm:text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                      បរិយាយមុខទំនិញ/សេវា
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                      បរិមាណ
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-xs sm:text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                      តម្លៃឯកតា
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-xs sm:text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600">
                      ថ្លៃទំនិញ/សេវា
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {service.service_items?.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-gray-600">
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">{index + 1}</td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">{item.description}</td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">{item.quantity}</td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
                        $ {(Number(item.unit_price) || 0).toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
                        $ {(Number(item.total_price) || 0).toFixed(2)}
                      </td>
                    </tr>
                  )) || (
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <td colSpan={5} className="px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 text-center text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400">
                        No service items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mb-6 sm:mb-8">
              <div className="w-full max-w-md">
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex justify-between items-center py-1 sm:py-2 border-t-2 border-gray-400 dark:border-gray-600">
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">តម្លៃសរុបរួមទាំងអាករ / Total include VAT in USD</span>
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">$ {(Number(service.total_amount) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">អត្រាប្តូរប្រាក់ / Exchange Rate 1 USD=</span>
                    <span className="text-red-600 font-bold text-sm sm:text-base">
                      {(service.exchange_rate || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 sm:py-2 border-t-2 border-gray-400 dark:border-gray-600">
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">សរុបជាប្រាក់រៀល / Balance to pay in KHR</span>
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      KHR {(service.total_khr || (Number(service.total_amount) || 0) * (service.exchange_rate || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Vehicle Information */}
            <div className="mb-6 sm:mb-8">
              <h3 className="font-semibold text-base sm:text-lg text-gray-800 dark:text-gray-200 mb-2 sm:mb-4">កំណត់សម្គាល់/Note:</h3>
              <div className="text-sm sm:text-base space-y-1 sm:space-y-2">
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">ស្លាកលេខ/Plate No:</span>
                  <span className="ml-1 sm:ml-2 text-gray-700 dark:text-gray-300">{service.vehicle_plate}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">ម៉ាករថយន្ត/Model:</span>
                  <span className="ml-1 sm:ml-2 text-gray-700 dark:text-gray-300">{service.vehicle_model_name || "—"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">លេខតួរថយន្ត/VIN No:</span>
                  <span className="ml-1 sm:ml-2 text-gray-700 dark:text-gray-300">{service.vehicle_vin_number || "—"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">គីឡូម៉ែត្រ/Kilometers:</span>
                  <span className="ml-1 sm:ml-2 text-gray-700 dark:text-gray-300">{service.current_km?.toLocaleString() || "—"}</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-12 sm:mt-16 md:mt-20">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 md:gap-8">
                {/* Prepared by */}
                <div className="text-center">
                  <div className="h-16 sm:h-20 md:h-24 border-t-2 border-gray-400 dark:border-gray-600 pt-2 sm:pt-3 md:pt-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">រៀបចំដោយៈ</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Prepared by:</p>
                  </div>
                </div>
                
                {/* Customer Signature */}
                <div className="text-center">
                  <div className="h-16 sm:h-20 md:h-24 border-t-2 border-gray-400 dark:border-gray-600 pt-2 sm:pt-3 md:pt-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">ហត្ថលេខានិងឈ្មោះអតិថិជន</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Customer's Signature & Name</p>
                  </div>
                </div>
                
                {/* Checked by */}
                <div className="text-center">
                  <div className="h-16 sm:h-20 md:h-24 border-t-2 border-gray-400 dark:border-gray-600 pt-2 sm:pt-3 md:pt-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">ត្រួតពិនិត្យដោយ</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Check Verified by:</p>
                  </div>
                </div>
                
                {/* Seller Signature */}
                <div className="text-center">
                  <div className="h-16 sm:h-20 md:h-24 border-t-2 border-gray-400 dark:border-gray-600 pt-2 sm:pt-3 md:pt-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">ហត្ថលេខា និងឈ្មោះអ្នកលក់</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Seller's Signature & Name</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

