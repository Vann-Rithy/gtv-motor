"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

interface InvoiceData {
  invoiceNumber: string
  customerName: string
  phone: string
  address: string
  plateNumber: string
  model: string
  vinNumber: string
  kilometers: string
  date: string
  services: Array<{
    description: string
    unitPrice: number
    quantity: number
    amount: number
  }>
  subtotal: number
  vatAmount: number
  total: number
  exchangeRate: number
  totalKHR: number
  notes: string
}

export default function InvoiceClientPage({ params }: { params: { id: string } }) {
  const printRef = useRef<HTMLDivElement>(null)
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number>(0)
  const [isEditingRate, setIsEditingRate] = useState(false)

  // Handle exchange rate change
  const handleExchangeRateChange = (newRate: number) => {
    setExchangeRate(newRate)
    if (invoice) {
      setInvoice({
        ...invoice,
        exchangeRate: newRate,
        totalKHR: invoice.total * newRate
      })
    }
  }

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to fetch invoice data from API
        const response = await apiClient.getServiceInvoice(params.id)
        const serviceData = response.data?.service || response.data

        if (serviceData) {
          // Transform API data to our InvoiceData format
          const transformedInvoice: InvoiceData = {
            invoiceNumber: serviceData.invoice_number || params.id,
            customerName: serviceData.customer_name || "Unknown Customer",
            phone: serviceData.customer_phone || "",
            address: serviceData.customer_address || "",
            plateNumber: serviceData.vehicle_plate || "",
            model: serviceData.vehicle_model_name || serviceData.vehicle_model || "",
            vinNumber: serviceData.vehicle_vin_number || "",
            kilometers: serviceData.current_km?.toString() || "",
            date: serviceData.service_date || new Date().toLocaleDateString(),
            services: serviceData.service_items?.map((item: any, index: number) => ({
              description: item.description || `Service Item ${index + 1}`,
              unitPrice: item.unit_price || 0,
              quantity: item.quantity || 1,
              amount: item.total_price || (item.unit_price * item.quantity) || 0,
            })) || [],
            subtotal: serviceData.total_amount || 0,
            vatAmount: 0,
            total: serviceData.total_amount || 0,
            exchangeRate: serviceData.exchange_rate || 0, // Use actual exchange rate from database
            totalKHR: serviceData.total_khr || (serviceData.total_amount || 0) * (serviceData.exchange_rate || 0),
            notes: serviceData.notes || "",
          }

          setInvoice(transformedInvoice)
          // Update exchange rate state with actual value from database
          setExchangeRate(serviceData.exchange_rate || 0)
        } else {
          throw new Error("No invoice data found")
        }
      } catch (err: any) {
        console.error("Failed to fetch invoice:", err)
        setError(err?.message || "Failed to fetch invoice data")
        
        // Fallback to sample data if API fails
        setInvoice({
          invoiceNumber: params.id || "HQ25-0082",
          customerName: "ឈៀង សុខលី",
          phone: "10793400",
          address: "ភ្នំពេញ",
          plateNumber: "282-5465",
          model: "KAIN",
          vinNumber: "7114",
          kilometers: "23408",
          date: "14-Oct-2025",
          services: [
            {
              description: "ជួសជុលចង្កៀងខាងមុខផ្នែកខាងលើស្តាំ",
              unitPrice: 33.00,
              quantity: 1,
              amount: 33.00,
            },
            {
              description: "ជួសជុលជើងចង្កៀងខាងមុខផ្នែកខាងក្រោមស្តាំ",
              unitPrice: 27.50,
              quantity: 1,
              amount: 27.50,
            },
            {
              description: "ជួសជុលផ្ទឹមធុងទឹកផ្នែកខាងមុខ-ស្តាំ",
              unitPrice: 44.00,
              quantity: 1,
              amount: 44.00,
            },
            {
              description: "ជួសជុលជើងធ្នឹមចង្កៀងមុខស្តាំ",
              unitPrice: 16.50,
              quantity: 1,
              amount: 16.50,
            },
            {
              description: "ជួសជុលបូឌៀរថ្ពាល់លើខាងស្តាំ",
              unitPrice: 16.50,
              quantity: 1,
              amount: 16.50,
            },
            {
              description: "ជួសជុល និងសារ៉េកាងមុខ",
              unitPrice: 33.00,
              quantity: 1,
              amount: 33.00,
            },
            {
              description: "តោនស្ងួតថ្ពាល់ និងសារ៉េថ្ពាល់ខាងស្តាំ",
              unitPrice: 22.00,
              quantity: 1,
              amount: 22.00,
            },
            {
              description: "ដូរប្រេងម៉ាស៊ីន",
              unitPrice: 16.50,
              quantity: 4.7,
              amount: 77.55,
            },
          ],
          subtotal: 270.05,
          vatAmount: 0,
          total: 270.05,
          exchangeRate: exchangeRate,
          totalKHR: 270.05 * exchangeRate,
          notes: "",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

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
          <p>Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || "Invoice not found"}</p>
          <Link href="/">
            <Button>Go Back</Button>
          </Link>
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
              <Link href="/" className="mr-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice {invoice.invoiceNumber}</h1>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
                <Printer className="h-4 w-4 mr-2" />
                Print
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
          <div className="bg-white p-8 border-b-2 border-gray-300 relative">
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">វិក្កយបត្រ</h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-700">INVOICE</h2>
          </div>
        </div>

          {/* Invoice Details and Customer Information */}
          <div className="p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
              {/* Customer Information - Left Side */}
              <div>
                <div className="text-sm sm:text-base">
                  <div className="mb-1 sm:mb-2">
                    <span className="font-semibold text-gray-800">ឈ្មោះអតិថិជន/Customer Name:</span>
                    <span className="ml-1 sm:ml-2 text-gray-700">{invoice.customerName}</span>
                  </div>
                  <div className="mb-1 sm:mb-2">
                    <span className="font-semibold text-gray-800">អាសយដ្ឋាន/Address:</span>
                    <span className="ml-1 sm:ml-2 text-gray-700">{invoice.address}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">លេខទូរស័ព្ទ/ Tel:</span>
                    <span className="ml-1 sm:ml-2 text-gray-700">{invoice.phone}</span>
                  </div>
                </div>
              </div>
              
              {/* Invoice Details - Right Side */}
              <div>
                <div className="text-sm sm:text-base text-right">
                  <div className="mb-1 sm:mb-2">
                    <span className="font-semibold text-gray-800">លេខវិក្កយបត្រ Invoice No.:</span>
                    <span className="ml-1 sm:ml-2 text-gray-700">{invoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">កាលបរិច្ឆេទ / Date:</span>
                    <span className="ml-1 sm:ml-2 text-gray-700">{invoice.date}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Items Table */}
            <div className="border border-gray-300 overflow-hidden mb-6 sm:mb-8">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base font-semibold text-gray-800 border-b border-gray-300">
                      N°
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs sm:text-sm md:text-base font-semibold text-gray-800 border-b border-gray-300">
                      បរិយាយមុខទំនិញ/សេវា
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base font-semibold text-gray-800 border-b border-gray-300">
                      បរិមាណ
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-xs sm:text-sm md:text-base font-semibold text-gray-800 border-b border-gray-300">
                      តម្លៃឯកតា
                    </th>
                    <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-xs sm:text-sm md:text-base font-semibold text-gray-800 border-b border-gray-300">
                      ថ្លៃទំនិញ/សេវា
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.services.map((service, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base text-gray-700">{index + 1}</td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base text-gray-700">{service.description}</td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base text-gray-700">{service.quantity}</td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-xs sm:text-sm md:text-base text-gray-700">
                        $ {service.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-xs sm:text-sm md:text-base font-medium text-gray-900">
                        $ {service.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mb-6 sm:mb-8">
              <div className="w-full max-w-md">
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex justify-between items-center py-1 sm:py-2 border-t-2 border-gray-400">
                    <span className="font-bold text-sm sm:text-base text-gray-900">តម្លៃសរុបរួមទាំងអាករ / Total include VAT in USD</span>
                    <span className="font-bold text-sm sm:text-base text-gray-900">$ {invoice.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-700">អត្រាប្តូរប្រាក់ / Exchange Rate 1 USD=</span>
                    {isEditingRate ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={exchangeRate}
                          onChange={(e) => handleExchangeRateChange(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-red-600 font-bold"
                          min="1"
                          step="1"
                        />
                        <button
                          onClick={() => setIsEditingRate(false)}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingRate(false)
                            setExchangeRate(invoice.exchangeRate)
                          }}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-red-600 font-bold text-sm sm:text-base">{invoice.exchangeRate.toLocaleString()}</span>
                        <button
                          onClick={() => setIsEditingRate(true)}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 print:hidden"
                          title="Edit Exchange Rate"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-1 sm:py-2 border-t-2 border-gray-400">
                    <span className="font-bold text-sm sm:text-base text-gray-900">សរុបជាប្រាក់រៀល / Balance to pay in KHR</span>
                    <span className="font-bold text-sm sm:text-base text-gray-900">KHR {invoice.totalKHR.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Vehicle Information */}
            <div className="mb-6 sm:mb-8">
              <h3 className="font-semibold text-base sm:text-lg text-gray-800 mb-2 sm:mb-4">កំណត់សម្គាល់/Note:</h3>
              <div className="text-sm sm:text-base space-y-1 sm:space-y-2">
                <div>
                  <span className="font-semibold">ស្លាកលេខ/Plate No:</span>
                  <span className="ml-1 sm:ml-2">{invoice.plateNumber}</span>
                </div>
                <div>
                  <span className="font-semibold">ម៉ាករថយន្ត/Model:</span>
                  <span className="ml-1 sm:ml-2">{invoice.model}</span>
                </div>
                <div>
                  <span className="font-semibold">លេខតួរថយន្ត/VIN No:</span>
                  <span className="ml-1 sm:ml-2">{invoice.vinNumber}</span>
                </div>
                <div>
                  <span className="font-semibold">គីឡូម៉ែត្រ/Kilometers:</span>
                  <span className="ml-1 sm:ml-2">{invoice.kilometers}</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-12 sm:mt-16 md:mt-20">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 md:gap-8">
                {/* Prepared by */}
                <div className="text-center">
                  <div className="h-16 sm:h-20 md:h-24 border-t-2 border-gray-400 pt-2 sm:pt-3 md:pt-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-800">រៀបចំដោយៈ</p>
                    <p className="text-xs text-gray-600 mt-1">Prepared by:</p>
                  </div>
                </div>
                
                {/* Customer Signature */}
                <div className="text-center">
                  <div className="h-16 sm:h-20 md:h-24 border-t-2 border-gray-400 pt-2 sm:pt-3 md:pt-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-800">ហត្ថលេខានិងឈ្មោះអតិថិជន</p>
                    <p className="text-xs text-gray-600 mt-1">Customer's Signature & Name</p>
                  </div>
                </div>
                
                {/* Checked by */}
                <div className="text-center">
                  <div className="h-16 sm:h-20 md:h-24 border-t-2 border-gray-400 pt-2 sm:pt-3 md:pt-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-800">ត្រួតពិនិត្យដោយ</p>
                    <p className="text-xs text-gray-600 mt-1">Check Verified by:</p>
                  </div>
                </div>
                
                {/* Seller Signature */}
                <div className="text-center">
                  <div className="h-16 sm:h-20 md:h-24 border-t-2 border-gray-400 pt-2 sm:pt-3 md:pt-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-800">ហត្ថលេខា និងឈ្មោះអ្នកលក់</p>
                    <p className="text-xs text-gray-600 mt-1">Seller's Signature & Name</p>
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

