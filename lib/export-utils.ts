// Export utility functions for reports

export interface ExportData {
  summary?: any
  data?: any[]
  metadata: {
    title: string
    dateRange: string
    generatedAt: string
    reportType: string
  }
}

// CSV Export
export const exportToCSV = (data: ExportData): void => {
  const { summary, data: reportData, metadata } = data
  
  let csvContent = ''
  
  // Add metadata header
  csvContent += `${metadata.title}\n`
  csvContent += `Date Range: ${metadata.dateRange}\n`
  csvContent += `Generated: ${metadata.generatedAt}\n`
  csvContent += `Report Type: ${metadata.reportType}\n\n`
  
  // Add summary if available
  if (summary) {
    csvContent += 'Summary\n'
    Object.entries(summary).forEach(([key, value]) => {
      csvContent += `${key},${value}\n`
    })
    csvContent += '\n'
  }
  
  // Add detailed data if available
  if (reportData && reportData.length > 0) {
    // Get headers from first row
    const headers = Object.keys(reportData[0])
    csvContent += headers.join(',') + '\n'
    
    // Add data rows
    reportData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header]
        // Handle values that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value
      })
      csvContent += values.join(',') + '\n'
    })
  }
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${metadata.reportType.toLowerCase()}_report_${metadata.dateRange.replace(/\//g, '-')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Excel Export (using a simple HTML table approach)
export const exportToExcel = (data: ExportData): void => {
  const { summary, data: reportData, metadata } = data
  
  let htmlContent = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${metadata.title}</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .summary { margin-bottom: 20px; }
          .metadata { margin-bottom: 20px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${metadata.title}</h1>
        <div class="metadata">
          <p><strong>Date Range:</strong> ${metadata.dateRange}</p>
          <p><strong>Generated:</strong> ${metadata.generatedAt}</p>
          <p><strong>Report Type:</strong> ${metadata.reportType}</p>
        </div>
  `
  
  // Add summary if available
  if (summary) {
    htmlContent += '<div class="summary"><h2>Summary</h2><table>'
    Object.entries(summary).forEach(([key, value]) => {
      htmlContent += `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>`
    })
    htmlContent += '</table></div>'
  }
  
  // Add detailed data if available
  if (reportData && reportData.length > 0) {
    htmlContent += '<h2>Detailed Data</h2><table>'
    
    // Add headers
    const headers = Object.keys(reportData[0])
    htmlContent += '<tr>'
    headers.forEach(header => {
      htmlContent += `<th>${header}</th>`
    })
    htmlContent += '</tr>'
    
    // Add data rows
    reportData.forEach(row => {
      htmlContent += '<tr>'
      headers.forEach(header => {
        htmlContent += `<td>${row[header] || ''}</td>`
      })
      htmlContent += '</tr>'
    })
    
    htmlContent += '</table>'
  }
  
  htmlContent += '</body></html>'
  
  // Create and download file
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${metadata.reportType.toLowerCase()}_report_${metadata.dateRange.replace(/\//g, '-')}.xls`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// PDF Export (using jsPDF library)
export const exportToPDF = async (data: ExportData): Promise<void> => {
  try {
    // Dynamic import of jsPDF to avoid SSR issues
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    
    const doc = new jsPDF()
    
    const { summary, data: reportData, metadata } = data
    
    // Add title
    doc.setFontSize(20)
    doc.text(metadata.title, 20, 20)
    
    // Add metadata
    doc.setFontSize(12)
    doc.text(`Date Range: ${metadata.dateRange}`, 20, 35)
    doc.text(`Generated: ${metadata.generatedAt}`, 20, 42)
    doc.text(`Report Type: ${metadata.reportType}`, 20, 49)
    
    let yPosition = 60
    
    // Add summary if available
    if (summary) {
      doc.setFontSize(16)
      doc.text('Summary', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      Object.entries(summary).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 20, yPosition)
        yPosition += 7
      })
      yPosition += 10
    }
    
    // Add detailed data if available
    if (reportData && reportData.length > 0) {
      doc.setFontSize(16)
      doc.text('Detailed Data', 20, yPosition)
      yPosition += 10
      
      const headers = Object.keys(reportData[0])
      const tableData = reportData.map(row => 
        headers.map(header => row[header] || '')
      )
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      })
    }
    
    // Save the PDF
    doc.save(`${metadata.reportType.toLowerCase()}_report_${metadata.dateRange.replace(/\//g, '-')}.pdf`)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    // Fallback to alert if PDF generation fails
    alert('PDF generation failed. Please try CSV or Excel export instead.')
  }
}

// Helper function to format data for export
export const formatDataForExport = (
  reportType: string,
  data: any,
  dateRange: { from: string; to: string }
): ExportData => {
  const metadata = {
    title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
    dateRange: `${dateRange.from} to ${dateRange.to}`,
    generatedAt: new Date().toLocaleString(),
    reportType: reportType
  }
  
  switch (reportType) {
    case 'summary':
      return {
        summary: {
          'Total Revenue': `$${data.totalRevenue?.toFixed(2) || 0}`,
          'Total Services': data.totalServices || 0,
          'Average Service Value': `$${data.averageServiceValue?.toFixed(2) || 0}`,
          'Top Service': data.topService || 'N/A',
          'Customer Growth': data.customerGrowth || 0
        },
        data: [
          ...(data.servicesByType || []).map((item: any) => ({
            'Service Type': item.type,
            'Count': item.count,
            'Revenue': `$${item.revenue?.toFixed(2) || 0}`
          })),
          ...(data.monthlyTrend || []).map((item: any) => ({
            'Month': item.month,
            'Revenue': `$${item.revenue?.toFixed(2) || 0}`,
            'Services': item.services
          }))
        ],
        metadata
      }
      
    case 'warranty':
      return {
        summary: {
          'Total Warranties': data.summary?.totalWarranties || 0,
          'Active Warranties': data.summary?.activeWarranties || 0,
          'Expired Warranties': data.summary?.expiredWarranties || 0,
          'Expiring Soon': data.summary?.expiringSoon || 0,
          'Total Cost Covered': `$${data.summary?.totalCostCovered?.toFixed(2) || 0}`
        },
        data: [
          ...(data.byStatus || []).map((item: any) => ({
            'Status': item.status,
            'Count': item.count,
            'Total Cost': `$${item.totalCost?.toFixed(2) || 0}`
          })),
          ...(data.claims || []).map((item: any) => ({
            'Claim Date': new Date(item.claimDate).toLocaleDateString(),
            'Description': item.description,
            'Amount': `$${item.amount?.toFixed(2) || 0}`,
            'Status': item.status,
            'Customer': item.customerName,
            'Vehicle': item.vehiclePlate
          })),
          ...(data.monthlyTrend || []).map((item: any) => ({
            'Month': item.month,
            'New Warranties': item.newWarranties,
            'Total Cost': `$${item.totalCost?.toFixed(2) || 0}`
          }))
        ],
        metadata
      }
      
    case 'customer':
      return {
        summary: {
          'Total Customers': data.summary?.totalCustomers || 0,
          'Active Customers': data.summary?.activeCustomers || 0,
          'Inactive Customers': data.summary?.inactiveCustomers || 0,
          'Average Service Value': `$${data.summary?.averageServiceValue?.toFixed(2) || 0}`
        },
        data: [
          ...(data.topCustomers || []).map((item: any) => ({
            'Name': item.name,
            'Phone': item.phone,
            'Email': item.email,
            'Total Services': item.totalServices,
            'Total Spent': `$${item.totalSpent?.toFixed(2) || 0}`,
            'Average Service Cost': `$${item.averageServiceCost?.toFixed(2) || 0}`,
            'Last Service': new Date(item.lastServiceDate).toLocaleDateString()
          })),
          ...(data.servicePreferences || []).map((item: any) => ({
            'Service Type': item.serviceType,
            'Service Count': item.serviceCount,
            'Unique Customers': item.uniqueCustomers
          }))
        ],
        metadata
      }
      
    case 'inventory':
      return {
        summary: {
          'Total Items': data.summary?.totalItems || 0,
          'Total Value': `$${data.summary?.totalValue?.toFixed(2) || 0}`,
          'Low Stock Items': data.lowStock?.length || 0,
          'Categories': data.byCategory?.length || 0
        },
        data: [
          ...(data.byCategory || []).map((item: any) => ({
            'Category': item.category,
            'Item Count': item.itemCount,
            'Total Value': `$${item.totalValue?.toFixed(2) || 0}`,
            'Average Price': `$${item.averagePrice?.toFixed(2) || 0}`
          })),
          ...(data.lowStock || []).map((item: any) => ({
            'Item Name': item.itemName,
            'Category': item.category,
            'Quantity': item.quantity,
            'Reorder Level': item.reorderLevel,
            'Unit Price': `$${item.unitPrice?.toFixed(2) || 0}`
          })),
          ...(data.monthlyTrend || []).map((item: any) => ({
            'Month': item.month,
            'Items Sold': item.itemsSold,
            'Revenue': `$${item.revenue?.toFixed(2) || 0}`
          }))
        ],
        metadata
      }
      
    default:
      return {
        summary: {},
        data: [],
        metadata
      }
  }
}
