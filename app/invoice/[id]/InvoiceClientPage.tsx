"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Link from "next/link"

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
  total: number
  notes: string
}

export default function InvoiceClientPage({ params }: { params: { id: string } }) {
  const printRef = useRef<HTMLDivElement>(null)

  // Sample invoice data - in real app, fetch based on params.id
  const [invoice] = useState<InvoiceData>({
    invoiceNumber: params.id || "SR25-0495",
    customerName: "មាំង មេសា",
    phone: "097 79 55556",
    address: "កំពង់ស្ពឺ",
    plateNumber: "2CE-7339",
    model: "Kain PHEV option 3",
    vinNumber: "438",
    kilometers: "5142",
    date: "28-Aug-2025",
    services: [
      {
        description: "ជួសជុលកាងខាងមុខ",
        unitPrice: 30.0,
        quantity: 1,
        amount: 30.0,
      },
      {
        description: "ប្តូរបទៀ",
        unitPrice: 25.0,
        quantity: 1,
        amount: 25.0,
      },
      {
        description: "Labor cost (1 H=$10)",
        unitPrice: 10.0,
        quantity: 1,
        amount: 10.0,
      },
    ],
    total: 71.50,
    notes: "សូមទូទាត់តាមរយោះ QR CODE",
  })

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
          <div className="bg-white p-6 border-b-2 border-gray-300 relative">
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
              <h1 className="text-3xl font-bold text-gray-800">វិក្កយបត្រ</h1>
              <h2 className="text-2xl font-semibold text-gray-700">INVOICE</h2>
            </div>
          </div>

          {/* Invoice Details and Customer Information */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Information - Left Side */}
              <div>
                <div className="text-sm">
                  <div className="mb-1">
                    <span className="font-semibold text-gray-800">ឈ្មោះអតិថិជន/Customer Name:</span>
                    <span className="ml-2 text-gray-700">{invoice.customerName}</span>
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold text-gray-800">អាសយដ្ឋាន/Address:</span>
                    <span className="ml-2 text-gray-700">{invoice.address}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">លេខទូរស័ព្ទ/ Tel:</span>
                    <span className="ml-2 text-gray-700">{invoice.phone}</span>
                  </div>
                </div>
              </div>
              
              {/* Invoice Details - Right Side */}
              <div>
                <div className="text-sm text-right">
                  <div className="mb-1">
                    <span className="font-semibold text-gray-800">លេខវិក្កយបត្រ /Invoice:</span>
                    <span className="ml-2 text-gray-700">{invoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">កាលបរិច្ឆេទ / Date:</span>
                    <span className="ml-2 text-gray-700">{invoice.date}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Items Table */}
            <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 border-b border-gray-300">
                      N°
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 border-b border-gray-300">
                      បរិយាយមុខទំនិញ/សេវា
                      <br />
                      (Description of Goods/Services)
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800 border-b border-gray-300">
                      បរិមាណ
                      <br />
                      (Quantity)
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 border-b border-gray-300">
                      តម្លៃឯកតា
                      <br />
                      (Unit Price)
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 border-b border-gray-300">
                      ថ្លៃទំនិញ/សេវា
                      <br />
                      (Amount)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.services.map((service, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-4 py-3 text-center text-gray-700">{index + 1}</td>
                      <td className="px-4 py-3 text-gray-700">{service.description}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{service.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        ${service.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ${service.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Empty rows for formatting */}
                  {[...Array(3)].map((_, index) => (
                    <tr key={`empty-${index}`} className="border-b border-gray-200">
                      <td className="px-4 py-3 text-center text-gray-700">
                        {invoice.services.length + index + 1}
                      </td>
                      <td className="px-4 py-3">&nbsp;</td>
                      <td className="px-4 py-3">&nbsp;</td>
                      <td className="px-4 py-3">&nbsp;</td>
                      <td className="px-4 py-3">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mb-6">
              <div className="w-80">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="text-gray-700">$65.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">VAT 10%:</span>
                    <span className="text-gray-700">$6.50</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-400">
                    <span className="font-bold text-gray-900">Total (including VAT 10% in USD):</span>
                    <span className="font-bold text-gray-900">$71.50</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Vehicle Information */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">កំណត់សម្គាល់/Note:</h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-semibold">ស្លាកលេខ/Plate No:</span>
                  <span className="ml-2">{invoice.plateNumber}</span>
                </div>
                <div>
                  <span className="font-semibold">ម៉ាករថយន្ត/Model:</span>
                  <span className="ml-2">{invoice.model}</span>
                </div>
                <div>
                  <span className="font-semibold">លេខតួរថយន្ត/VIN No:</span>
                  <span className="ml-2">{invoice.vinNumber}</span>
                </div>
                <div>
                  <span className="font-semibold">គីឡូម៉ែត្រ/Kilometers:</span>
                  <span className="ml-2">{invoice.kilometers}km</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2 mt-16">
                  <p className="text-sm font-medium text-gray-800">ហត្ថលេខា និងឈ្មោះអ្នកទិញ</p>
                  <p className="text-sm text-gray-600">Customer's Signature & Name</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2 mt-16">
                  <p className="text-sm font-medium text-gray-800">ហត្ថលេខា និងឈ្មោះអ្នកលក់</p>
                  <p className="text-sm text-gray-600">Seller's Signature & Name</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

