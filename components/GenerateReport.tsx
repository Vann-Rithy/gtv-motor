"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, FileText, FileSpreadsheet, File } from "lucide-react"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

// Register Khmer fonts for PDF
// Note: For production, download Noto Sans Khmer or Battambang font files and register them
// Example: Font.register({ family: "NotoSansKhmer", src: "/fonts/NotoSansKhmer-Regular.ttf" })
// For now, using Helvetica as fallback (supports basic Latin characters)
// To add Khmer font support:
// 1. Download font files (e.g., from Google Fonts)
// 2. Place them in public/fonts/
// 3. Register: Font.register({ family: "NotoSansKhmer", src: "/fonts/NotoSansKhmer-Regular.ttf" })
// 4. Update pdfStyles to use "NotoSansKhmer"

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Helvetica", // Change to "NotoSansKhmer" after registering Khmer font
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #1e40af",
    paddingBottom: 15,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 5,
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1f2937",
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f3f4f6",
    padding: 8,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1f2937",
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    borderTop: "1 solid #e5e7eb",
    paddingTop: 10,
  },
})

// Types
export interface ReportDataRow {
  [key: string]: string | number | null | undefined
}

export interface ReportMeta {
  title: string
  date?: string
  logo?: string
  generatedBy?: string
  dateRange?: {
    from: string
    to: string
  }
}

export interface ChartData {
  type: "bar" | "pie"
  title: string
  data: Array<{
    name: string
    value: number
    [key: string]: string | number
  }>
  colors?: string[]
}

interface GenerateReportProps {
  reportData: ReportDataRow[]
  reportMeta: ReportMeta
  chartData?: ChartData
  columns?: string[] // If not provided, will use all keys from first row
}

// PDF Document Component
const PDFDocument: React.FC<{
  reportData: ReportDataRow[]
  reportMeta: ReportMeta
  chartData?: ChartData
  columns: string[]
}> = ({ reportData, reportMeta, chartData, columns }) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          {reportMeta.logo && (
            <View style={pdfStyles.logoContainer}>
              <Image src={reportMeta.logo} style={{ width: 60, height: 60, marginRight: 10 }} />
            </View>
          )}
          <Text style={pdfStyles.title}>{reportMeta.title}</Text>
          {reportMeta.date && <Text style={pdfStyles.subtitle}>Date: {reportMeta.date}</Text>}
          {reportMeta.dateRange && (
            <Text style={pdfStyles.subtitle}>
              Period: {reportMeta.dateRange.from} to {reportMeta.dateRange.to}
            </Text>
          )}
          <Text style={pdfStyles.subtitle}>Generated: {currentDate}</Text>
          {reportMeta.generatedBy && <Text style={pdfStyles.subtitle}>By: {reportMeta.generatedBy}</Text>}
        </View>

        {/* Chart Section */}
        {chartData && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>{chartData.title}</Text>
            <Text style={{ fontSize: 10, color: "#6b7280", marginTop: 5 }}>
              Chart visualization would be rendered here. For full chart support, consider using canvas rendering.
            </Text>
          </View>
        )}

        {/* Table Section */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Report Data</Text>
          <View style={pdfStyles.table}>
            {/* Table Header */}
            <View style={pdfStyles.tableRow}>
              {columns.map((col, idx) => (
                <View key={idx} style={pdfStyles.tableColHeader}>
                  <Text style={pdfStyles.tableCellHeader}>{col}</Text>
                </View>
              ))}
            </View>
            {/* Table Rows */}
            {reportData.map((row, rowIdx) => (
              <View key={rowIdx} style={pdfStyles.tableRow}>
                {columns.map((col, colIdx) => (
                  <View key={colIdx} style={pdfStyles.tableCol}>
                    <Text style={pdfStyles.tableCell}>{String(row[col] ?? "")}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          This report was generated automatically on {currentDate}. © {new Date().getFullYear()} All rights reserved.
        </Text>
      </Page>
    </Document>
  )
}

export default function GenerateReport({
  reportData,
  reportMeta,
  chartData,
  columns,
}: GenerateReportProps) {
  const [exporting, setExporting] = useState<"csv" | "excel" | "pdf" | null>(null)

  // Determine columns to use
  const tableColumns = columns || (reportData.length > 0 ? Object.keys(reportData[0]) : [])

  // Format date for filename
  const formatDateForFilename = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}${month}${day}`
  }

  // CSV Export with UTF-8 BOM for Khmer text support
  const handleCSVExport = () => {
    setExporting("csv")
    try {
      // Prepare CSV content
      const headers = tableColumns
      const rows = reportData.map((row) =>
        tableColumns.map((col) => {
          const value = row[col] ?? ""
          // Escape values containing commas, quotes, or newlines
          if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
      )

      // Convert to CSV string
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n")

      // Add UTF-8 BOM for Excel compatibility with Khmer text
      const BOM = "\uFEFF"
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })

      // Download file
      saveAs(blob, `Report_${formatDateForFilename()}.csv`)
    } catch (error) {
      console.error("CSV export error:", error)
      alert("Failed to export CSV file. Please try again.")
    } finally {
      setExporting(null)
    }
  }


  // Excel Export
  const handleExcelExport = async () => {
    setExporting("excel")
    try {
      // Create workbook
      const wb = XLSX.utils.book_new()

      // Prepare data
      const wsData = [tableColumns, ...reportData.map((row) => tableColumns.map((col) => row[col] ?? ""))]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Set column widths
      const colWidths = tableColumns.map((col) => ({
        wch: Math.max(col.length, 15),
      }))
      ws["!cols"] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Report Data")

      // Add metadata sheet if needed
      if (reportMeta) {
        const metaData = [
          ["Report Title", reportMeta.title],
          ["Date", reportMeta.date || new Date().toLocaleDateString()],
          ["Generated", new Date().toLocaleString()],
        ]
        if (reportMeta.dateRange) {
          metaData.push(["Period From", reportMeta.dateRange.from])
          metaData.push(["Period To", reportMeta.dateRange.to])
        }
        if (reportMeta.generatedBy) {
          metaData.push(["Generated By", reportMeta.generatedBy])
        }
        const metaWs = XLSX.utils.aoa_to_sheet(metaData)
        XLSX.utils.book_append_sheet(wb, metaWs, "Metadata")
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Save file
      saveAs(blob, `Report_${formatDateForFilename()}.xlsx`)
    } catch (error) {
      console.error("Excel export error:", error)
      alert("Failed to export Excel file. Please try again.")
    } finally {
      setExporting(null)
    }
  }

  // PDF Export
  const handlePDFExport = async () => {
    setExporting("pdf")
    try {
      const { pdf } = await import("@react-pdf/renderer")
      const blob = await pdf(
        <PDFDocument
          reportData={reportData}
          reportMeta={reportMeta}
          chartData={chartData}
          columns={tableColumns}
        />
      ).toBlob()
      saveAs(blob, `Report_${formatDateForFilename()}.pdf`)
    } catch (error) {
      console.error("PDF export error:", error)
      alert("Failed to export PDF file. Please try again.")
    } finally {
      setExporting(null)
    }
  }

  // Render Chart
  const renderChart = () => {
    if (!chartData) return null

    const colors = chartData.colors || ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

    if (chartData.type === "bar") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill={colors[0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    } else if (chartData.type === "pie") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )
    }
    return null
  }

  return (
    <div className="w-full space-y-6">
      {/* Report Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {reportMeta.logo && (
                <img src={reportMeta.logo} alt="Logo" className="h-16 w-16 object-contain" />
              )}
              <div>
                <CardTitle className="text-2xl">{reportMeta.title}</CardTitle>
                <CardDescription className="mt-2">
                  {reportMeta.date && <span>Date: {reportMeta.date}</span>}
                  {reportMeta.dateRange && (
                    <span className="ml-4">
                      Period: {reportMeta.dateRange.from} to {reportMeta.dateRange.to}
                    </span>
                  )}
                  {reportMeta.generatedBy && <span className="ml-4">By: {reportMeta.generatedBy}</span>}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Chart Section */}
          {chartData && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-lg font-semibold mb-4">{chartData.title}</h3>
              {renderChart()}
            </div>
          )}

          {/* Table Section */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    {tableColumns.map((col, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.length > 0 ? (
                    reportData.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        {tableColumns.map((col, colIdx) => (
                          <td
                            key={colIdx}
                            className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                          >
                            {String(row[col] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={tableColumns.length} className="px-4 py-8 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Export the report in your preferred format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* CSV Export Button */}
            <Button
              onClick={handleCSVExport}
              disabled={exporting !== null || reportData.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              {exporting === "csv" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Export CSV
            </Button>

            {/* Excel Export Button */}
            <Button
              onClick={handleExcelExport}
              disabled={exporting !== null || reportData.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              {exporting === "excel" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Export Excel
            </Button>

            {/* PDF Export Button */}
            <Button
              onClick={handlePDFExport}
              disabled={exporting !== null || reportData.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <File className="h-4 w-4" />
              )}
              Export PDF
            </Button>
          </div>

          {exporting && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Generating {exporting.toUpperCase()} file, please wait...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

