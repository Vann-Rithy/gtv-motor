// lib/pdf-generator.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
  }
}

export interface InvoiceData {
  // Service Information
  serviceId: number
  invoiceNumber: string
  serviceDate: string
  serviceType: string
  serviceDetail: string

  // Customer Information
  customerName: string
  customerPhone: string
  customerEmail: string
  customerAddress: string

  // Vehicle Information
  vehiclePlate: string
  vehicleModel: string
  vehicleYear: number
  vehicleVin: string

  // Service Items
  serviceItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
    itemType: string
  }>

  // Pricing
  subtotal: number
  discountAmount: number
  vatRate: number
  vatAmount: number
  totalAmount: number

  // Payment Information
  paymentMethod: string
  paymentStatus: string

  // Additional Information
  notes?: string
  technicianName?: string
  salesRepName?: string
}

export class PDFInvoiceGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 20
  }

  generateInvoice(invoiceData: InvoiceData): void {
    this.addHeader(invoiceData)
    this.addCustomerInfo(invoiceData)
    this.addVehicleInfo(invoiceData)
    this.addServiceItems(invoiceData)
    this.addPricing(invoiceData)
    this.addFooter(invoiceData)

    // Save the PDF
    this.doc.save(`Invoice-${invoiceData.invoiceNumber}.pdf`)
  }

  private addHeader(invoiceData: InvoiceData): void {
    // Company Logo Area (placeholder)
    this.doc.setFillColor(41, 128, 185) // Blue background
    this.doc.rect(0, 0, this.pageWidth, 40, 'F')

    // Company Name
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('GTV MOTOR', this.margin, 25)

    // Invoice Title
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('SERVICE INVOICE', this.pageWidth - 60, 25)

    // Invoice Number and Date
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, this.pageWidth - 60, 35)
    this.doc.text(`Date: ${this.formatDate(invoiceData.serviceDate)}`, this.pageWidth - 60, 42)

    // Service Information
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Service Information', this.margin, 55)

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Service Type: ${invoiceData.serviceType}`, this.margin, 65)
    this.doc.text(`Service Detail: ${invoiceData.serviceDetail}`, this.margin, 72)
  }

  private addCustomerInfo(invoiceData: InvoiceData): void {
    const startY = 85

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Customer Information', this.margin, startY)

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    const customerInfo = [
      `Name: ${invoiceData.customerName}`,
      `Phone: ${invoiceData.customerPhone}`,
      `Email: ${invoiceData.customerEmail || 'N/A'}`,
      `Address: ${invoiceData.customerAddress || 'N/A'}`
    ]

    customerInfo.forEach((info, index) => {
      this.doc.text(info, this.margin, startY + 10 + (index * 7))
    })
  }

  private addVehicleInfo(invoiceData: InvoiceData): void {
    const startY = 125

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Vehicle Information', this.margin, startY)

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    const vehicleInfo = [
      `Plate Number: ${invoiceData.vehiclePlate}`,
      `Model: ${invoiceData.vehicleModel}`,
      `Year: ${invoiceData.vehicleYear}`,
      `VIN: ${invoiceData.vehicleVin || 'N/A'}`
    ]

    vehicleInfo.forEach((info, index) => {
      this.doc.text(info, this.margin, startY + 10 + (index * 7))
    })
  }

  private addServiceItems(invoiceData: InvoiceData): void {
    const startY = 165

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Service Items', this.margin, startY)

    // Prepare table data
    const tableData = invoiceData.serviceItems.map(item => [
      item.description,
      item.itemType.toUpperCase(),
      item.quantity.toString(),
      `$${(Number(item.unitPrice) || 0).toFixed(2)}`,
      `$${(Number(item.totalPrice) || 0).toFixed(2)}`
    ])

    // Add table
    autoTable(this.doc, {
      startY: startY + 10,
      head: [['Description', 'Type', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    })
  }

  private addPricing(invoiceData: InvoiceData): void {
    const finalY = (this.doc as any).lastAutoTable?.finalY || 200
    const startY = finalY + 20

    // Pricing summary
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')

    const pricingItems = [
      { label: 'Subtotal:', value: `$${(Number(invoiceData.subtotal) || 0).toFixed(2)}` },
      { label: 'Discount:', value: `-$${(Number(invoiceData.discountAmount) || 0).toFixed(2)}` },
      { label: `VAT (${invoiceData.vatRate}%):`, value: `$${(Number(invoiceData.vatAmount) || 0).toFixed(2)}` },
      { label: 'TOTAL:', value: `$${(Number(invoiceData.totalAmount) || 0).toFixed(2)}` }
    ]

    const rightAlign = this.pageWidth - this.margin

    pricingItems.forEach((item, index) => {
      const y = startY + (index * 8)

      if (item.label === 'TOTAL:') {
        this.doc.setFontSize(14)
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(41, 128, 185)
      } else {
        this.doc.setFontSize(12)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(0, 0, 0)
      }

      this.doc.text(item.label, rightAlign - 50, y)
      this.doc.text(item.value, rightAlign, y)
    })

    // Payment Information
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Payment Method: ${invoiceData.paymentMethod.toUpperCase()}`, this.margin, startY + 40)
    this.doc.text(`Payment Status: ${invoiceData.paymentStatus.toUpperCase()}`, this.margin, startY + 47)
  }

  private addFooter(invoiceData: InvoiceData): void {
    const footerY = this.pageHeight - 30

    // Notes section
    if (invoiceData.notes) {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Notes:', this.margin, footerY - 20)

      this.doc.setFont('helvetica', 'normal')
      const splitNotes = this.doc.splitTextToSize(invoiceData.notes, this.pageWidth - (this.margin * 2))
      this.doc.text(splitNotes, this.margin, footerY - 10)
    }

    // Footer line
    this.doc.setDrawColor(200, 200, 200)
    this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY)

    // Footer text
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100)
    this.doc.text('Thank you for choosing GTV Motor!', this.margin, footerY + 10)
    this.doc.text('Generated on: ' + new Date().toLocaleDateString(), this.pageWidth - 60, footerY + 10)
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }
}

// Utility function to generate invoice PDF
export function generateInvoicePDF(invoiceData: InvoiceData): void {
  const generator = new PDFInvoiceGenerator()
  generator.generateInvoice(invoiceData)
}

// Utility function to generate invoice PDF and return as blob
export function generateInvoicePDFBlob(invoiceData: InvoiceData): Blob {
  const generator = new PDFInvoiceGenerator()
  generator.generateInvoice(invoiceData)

  // Return the PDF as blob
  return generator.doc.output('blob')
}
