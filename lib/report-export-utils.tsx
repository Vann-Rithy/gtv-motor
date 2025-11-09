/**
 * Report Export Utilities
 * Functions to export reports in CSV, Excel, and PDF formats
 * Compatible with the existing report data structures
 */

import * as XLSX from "xlsx"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { ReportDataRow, ReportMeta } from "@/components/GenerateReport"

// PDF Styles - Professional Design
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    paddingTop: 25,
    paddingBottom: 60,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 25,
    borderBottom: "3 solid #1e40af",
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  logoImage: {
    width: 80,
    height: 80,
    objectFit: "contain",
    marginRight: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 3,
    lineHeight: 1.5,
  },
  section: {
    marginTop: 25,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1f2937",
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 4,
  },
  table: {
    width: "100%",
    marginTop: 12,
    borderCollapse: "collapse",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 24,
    width: "100%",
    alignItems: "stretch",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderWidth: 1,
    backgroundColor: "#1e40af",
    padding: 8,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    padding: 6,
    borderColor: "#d1d5db",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tableCell: {
    fontSize: 8,
    color: "#374151",
    lineHeight: 1.4,
    flexWrap: "wrap",
    textAlign: "left",
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1f2937",
    width: "40%",
  },
  summaryValue: {
    fontSize: 11,
    color: "#374151",
    width: "60%",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#9ca3af",
    textAlign: "center",
    borderTop: "1 solid #e5e7eb",
    paddingTop: 12,
    lineHeight: 1.5,
  },
})

// PDF Document Component
const PDFDocument: React.FC<{
  reportData: ReportDataRow[]
  reportMeta: ReportMeta
  columns: string[]
}> = ({ reportData, reportMeta, columns }) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Calculate column widths dynamically based on actual data content
  const calculateColumnWidth = (col: string, totalCols: number, index: number) => {
    // Analyze data to determine optimal column widths
    let maxContentLength = col.length // Start with header length
    let hasLongContent = false

    reportData.forEach((row) => {
      const value = String(row[col] ?? "")
      if (value.length > maxContentLength) {
        maxContentLength = value.length
      }
      if (value.length > 30) hasLongContent = true
    })

    // Base width calculation on content length
    const avgCharWidth = 0.5 // Approximate character width in percentage
    const baseWidth = Math.max(maxContentLength * avgCharWidth, 8) // Minimum 8%

    // For small tables (1-3 columns), use content-based widths
    if (totalCols <= 3) {
      const totalBaseWidth = columns.reduce((sum, c) => {
        let maxLen = c.length
        reportData.forEach((row) => {
          const val = String(row[c] ?? "")
          if (val.length > maxLen) maxLen = val.length
        })
        return sum + Math.max(maxLen * avgCharWidth, 8)
      }, 0)
      return `${(baseWidth / totalBaseWidth) * 100}%`
    }

    // For medium tables (4-5 columns)
    if (totalCols <= 5) {
      // First column (usually names/descriptions) gets more space if it has long content
      if (index === 0 && hasLongContent) {
        return "30%"
      }
      if (index === 0) return "25%"
      // Distribute remaining space
      const remaining = index === 0 ? 75 : 100
      return `${remaining / (totalCols - 1)}%`
    }

    // For larger tables (6+ columns), optimize for readability
    // Identify which columns typically have longer content
    const columnLengths = columns.map((c) => {
      let maxLen = c.length
      reportData.forEach((row) => {
        const val = String(row[c] ?? "")
        if (val.length > maxLen) maxLen = val.length
      })
      return maxLen
    })

    const sortedLengths = [...columnLengths].sort((a, b) => b - a)
    const isLongColumn = columnLengths[index] >= sortedLengths[Math.min(2, totalCols - 1)]

    if (isLongColumn && index < 3) {
      // Long content columns get more space
      return index === 0 ? "22%" : index === 1 ? "18%" : "15%"
    }

    // Calculate total width used by long columns
    let usedWidth = 0
    let longColumnCount = 0
    columnLengths.forEach((len, idx) => {
      if (len >= sortedLengths[Math.min(2, totalCols - 1)]) {
        if (idx === 0) usedWidth += 22
        else if (idx === 1) usedWidth += 18
        else if (idx === 2) usedWidth += 15
        else usedWidth += 12
        longColumnCount++
      }
    })

    // Remaining columns share the rest equally
    const remainingCols = totalCols - longColumnCount
    const remainingWidth = Math.max(0, 100 - usedWidth)

    if (isLongColumn && index > 2) {
      return "12%"
    }

    // For non-long columns, distribute remaining space
    if (remainingCols > 0 && !isLongColumn) {
      return `${remainingWidth / remainingCols}%`
    }

    // Fallback: equal distribution
    return `${100 / totalCols}%`
  }

  // Check if this is a summary-style report (has Section column)
  const isSummaryStyle = columns.includes("Section")

  // Split table data into chunks for multi-page support
  const splitTableIntoPages = () => {
    if (isSummaryStyle) return [reportData] // Summary reports don't need splitting

    const rowsPerPage = 18 // Number of data rows per page (leaving room for header)
    const chunks: ReportDataRow[][] = []
    let currentChunk: ReportDataRow[] = []
    let dataRowCount = 0

    reportData.forEach((row) => {
      const isSeparator = Object.values(row).some((val) => String(val) === "---")

      // Don't count separators toward row limit, but include them in current chunk
      if (!isSeparator) {
        dataRowCount++
      }

      // Start new page when we hit the row limit
      if (!isSeparator && dataRowCount > rowsPerPage && currentChunk.length > 0) {
        chunks.push(currentChunk)
        currentChunk = [row]
        dataRowCount = 1
      } else {
        currentChunk.push(row)
      }
    })

    if (currentChunk.length > 0) {
      chunks.push(currentChunk)
    }

    return chunks.length > 0 ? chunks : [reportData]
  }

  const tableChunks = splitTableIntoPages()

  return (
    <Document>
      {isSummaryStyle ? (
        // Single page for summary reports
        <Page size="A4" style={pdfStyles.page}>
          {/* Header */}
          <View style={pdfStyles.header}>
            {reportMeta.logo && (
              <View style={pdfStyles.logoContainer}>
                <Image src={reportMeta.logo} style={pdfStyles.logoImage} />
              </View>
            )}
            <Text style={pdfStyles.title}>{reportMeta.title}</Text>
            <View style={{ marginTop: 8 }}>
              {reportMeta.dateRange && (
                <Text style={pdfStyles.subtitle}>
                  Period: {reportMeta.dateRange.from} to {reportMeta.dateRange.to}
                </Text>
              )}
              <Text style={pdfStyles.subtitle}>
                Generated: {currentDate} at {currentTime}
              </Text>
              {reportMeta.generatedBy && (
                <Text style={pdfStyles.subtitle}>Generated By: {reportMeta.generatedBy}</Text>
              )}
            </View>
          </View>

          {/* Report Data Section */}
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Report Details</Text>
            <View>
              {reportData.map((row, rowIdx) => {
                const section = row["Section"] as string
                const isSectionHeader = section && section.toUpperCase() === section && section.length > 0

                if (isSectionHeader) {
                  return (
                    <View key={rowIdx} style={{ marginTop: rowIdx > 0 ? 15 : 0, marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e40af", marginBottom: 5 }}>
                        {section}
                      </Text>
                    </View>
                  )
                }

                return (
                  <View key={rowIdx} style={pdfStyles.summaryRow}>
                    <Text style={pdfStyles.summaryLabel}>
                      {String(row["Metric"] ?? "")}:
                    </Text>
                    <Text style={pdfStyles.summaryValue}>
                      {String(row["Value"] ?? "")}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Footer */}
          <Text style={pdfStyles.footer}>
            This report was generated automatically on {currentDate} at {currentTime}.{"\n"}
            © {new Date().getFullYear()} GTV Motor. All rights reserved.
          </Text>
        </Page>
      ) : (
        // Multiple pages for table reports
        tableChunks.map((chunk, pageIdx) => (
          <Page key={pageIdx} size="A4" style={pdfStyles.page}>
            {/* Header - only on first page */}
            {pageIdx === 0 && (
              <View style={pdfStyles.header}>
                {reportMeta.logo && (
                  <View style={pdfStyles.logoContainer}>
                    <Image src={reportMeta.logo} style={pdfStyles.logoImage} />
                  </View>
                )}
                <Text style={pdfStyles.title}>{reportMeta.title}</Text>
                <View style={{ marginTop: 8 }}>
                  {reportMeta.dateRange && (
                    <Text style={pdfStyles.subtitle}>
                      Period: {reportMeta.dateRange.from} to {reportMeta.dateRange.to}
                    </Text>
                  )}
                  <Text style={pdfStyles.subtitle}>
                    Generated: {currentDate} at {currentTime}
                  </Text>
                  {reportMeta.generatedBy && (
                    <Text style={pdfStyles.subtitle}>Generated By: {reportMeta.generatedBy}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Report Data Section */}
            <View style={pdfStyles.section}>
              {pageIdx === 0 && <Text style={pdfStyles.sectionTitle}>Report Details</Text>}

              {/* Table Header - Repeat on each page */}
              <View style={[pdfStyles.tableRow, { minHeight: 28 }]} wrap={false}>
                {columns.map((col, idx) => {
                  const colWidth = calculateColumnWidth(col, columns.length, idx)
                  return (
                    <View
                      key={idx}
                      style={[
                        pdfStyles.tableColHeader,
                        { width: colWidth, minWidth: colWidth, maxWidth: colWidth },
                      ]}
                    >
                      <Text style={pdfStyles.tableCellHeader} wrap={true}>
                        {col}
                      </Text>
                    </View>
                  )
                })}
              </View>

              {/* Table Rows for this page */}
              {chunk.map((row, rowIdx) => {
                const isSeparator = Object.values(row).some((val) => String(val) === "---")
                return (
                  <View
                    key={rowIdx}
                    wrap={false}
                    style={[
                      pdfStyles.tableRow,
                      isSeparator && { backgroundColor: "#f3f4f6" },
                      !isSeparator && rowIdx % 2 === 0 && { backgroundColor: "#fafafa" },
                    ]}
                  >
                    {columns.map((col, colIdx) => {
                      const cellValue = String(row[col] ?? "")
                      const colWidth = calculateColumnWidth(col, columns.length, colIdx)
                      // Don't truncate - let text wrap naturally
                      const displayValue = cellValue

                      // Determine if this cell needs more height (for wrapped text)
                      const needsExtraHeight = cellValue.length > 40

                      return (
                        <View
                          key={colIdx}
                          style={[
                            pdfStyles.tableCol,
                            {
                              width: colWidth,
                              minWidth: colWidth,
                              maxWidth: colWidth,
                              minHeight: needsExtraHeight ? 30 : 24,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              pdfStyles.tableCell,
                              isSeparator && { fontWeight: "bold", color: "#9ca3af", fontSize: 7 },
                            ]}
                            wrap={true}
                          >
                            {displayValue}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                )
              })}
            </View>

            {/* Footer */}
            <Text style={pdfStyles.footer}>
              Page {pageIdx + 1} of {tableChunks.length} | Generated on {currentDate} at {currentTime}{"\n"}
              © {new Date().getFullYear()} GTV Motor. All rights reserved.
            </Text>
          </Page>
        ))
      )}
    </Document>
  )
}

// Format date for filename
const formatDateForFilename = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}${month}${day}`
}

// CSV Export with UTF-8 BOM for Khmer text support and modern formatting
export const exportReportToCSV = (reportData: ReportDataRow[], reportMeta: ReportMeta, columns: string[]) => {
  try {
    // Prepare CSV content with professional header section
    let csvLines: string[] = []

    // Add report header section
    csvLines.push("=".repeat(60))
    csvLines.push(reportMeta.title.toUpperCase())
    csvLines.push("=".repeat(60))
    csvLines.push("")
    csvLines.push("REPORT INFORMATION")
    csvLines.push("-".repeat(60))
    csvLines.push(`Report Period,${reportMeta.dateRange ? `${reportMeta.dateRange.from} to ${reportMeta.dateRange.to}` : "N/A"}`)
    csvLines.push(`Generated Date,${new Date().toLocaleString()}`)
    csvLines.push(`Generated By,${reportMeta.generatedBy || "System"}`)
    csvLines.push(`Total Records,${reportData.length}`)
    csvLines.push("")
    csvLines.push("=".repeat(60))
    csvLines.push("REPORT DATA")
    csvLines.push("=".repeat(60))
    csvLines.push("")

    // Add column headers
    const headers = columns
    csvLines.push(headers.join(","))
    csvLines.push("-".repeat(headers.join(",").length)) // Underline headers

    // Add data rows with proper formatting
    reportData.forEach((row, rowIdx) => {
      const isSeparator = Object.values(row).some((val) => String(val) === "---")
      const rowData = columns.map((col) => {
        const value = row[col] ?? ""
        const stringValue = String(value)
        // Escape values containing commas, quotes, or newlines
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })

      // Add separator line before separator rows (except first)
      if (isSeparator && rowIdx > 0) {
        csvLines.push("-".repeat(Math.max(headers.join(",").length, 50)))
      }

      csvLines.push(rowData.join(","))
    })

    csvLines.push("")
    csvLines.push("=".repeat(60))
    csvLines.push(`End of Report - Generated on ${new Date().toLocaleDateString()}`)
    csvLines.push("=".repeat(60))

    // Convert to CSV string
    const csvContent = csvLines.join("\n")

    // Add UTF-8 BOM for Excel compatibility with Khmer text
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })

    // Download file
    const filename = `${reportMeta.title.replace(/\s+/g, "_")}_${formatDateForFilename()}.csv`
    saveAs(blob, filename)
  } catch (error) {
    console.error("CSV export error:", error)
    throw new Error("Failed to export CSV file")
  }
}

// Excel Export with ExcelJS for professional styling and modern design
export const exportReportToExcel = async (reportData: ReportDataRow[], reportMeta: ReportMeta, columns: string[]) => {
  try {
    // Create workbook with ExcelJS
    const workbook = new ExcelJS.Workbook()
    workbook.creator = reportMeta.generatedBy || "GTV Motor System"
    workbook.created = new Date()
    workbook.modified = new Date()

    // Create main worksheet
    const worksheet = workbook.addWorksheet("Report Data", {
      pageSetup: {
        paperSize: 9, // A4
        orientation: "landscape", // Landscape for better table display
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    })

    // Define styles
    const titleStyle = {
      font: { name: "Arial", size: 18, bold: true, color: { argb: "FF1e40af" } },
      alignment: { horizontal: "center", vertical: "middle" },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFe0e7ff" },
      },
    }

    const headerStyle = {
      font: { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } },
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1e40af" },
      },
      border: {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      },
    }

    const infoStyle = {
      font: { name: "Arial", size: 10 },
      alignment: { vertical: "middle" },
    }

    const dataStyle = {
      font: { name: "Arial", size: 10 },
      alignment: { vertical: "middle" },
      border: {
        top: { style: "thin", color: { argb: "FFd1d5db" } },
        bottom: { style: "thin", color: { argb: "FFd1d5db" } },
        left: { style: "thin", color: { argb: "FFd1d5db" } },
        right: { style: "thin", color: { argb: "FFd1d5db" } },
      },
    }

    const separatorStyle = {
      font: { name: "Arial", size: 9, bold: true, color: { argb: "FF9ca3af" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFf3f4f6" },
      },
    }

    let currentRow = 1

    // Title row
    worksheet.mergeCells(currentRow, 1, currentRow, columns.length)
    const titleCell = worksheet.getCell(currentRow, 1)
    titleCell.value = reportMeta.title
    titleCell.style = titleStyle
    worksheet.getRow(currentRow).height = 30
    currentRow++

    // Empty row
    currentRow++

    // Report information section
    worksheet.getCell(currentRow, 1).value = "Report Period"
    worksheet.getCell(currentRow, 1).style = { ...infoStyle, font: { ...infoStyle.font, bold: true } }
    worksheet.getCell(currentRow, 2).value = reportMeta.dateRange
      ? `${reportMeta.dateRange.from} to ${reportMeta.dateRange.to}`
      : "N/A"
    worksheet.getCell(currentRow, 2).style = infoStyle
    currentRow++

    worksheet.getCell(currentRow, 1).value = "Generated Date"
    worksheet.getCell(currentRow, 1).style = { ...infoStyle, font: { ...infoStyle.font, bold: true } }
    worksheet.getCell(currentRow, 2).value = new Date().toLocaleString()
    worksheet.getCell(currentRow, 2).style = infoStyle
    currentRow++

    worksheet.getCell(currentRow, 1).value = "Generated By"
    worksheet.getCell(currentRow, 1).style = { ...infoStyle, font: { ...infoStyle.font, bold: true } }
    worksheet.getCell(currentRow, 2).value = reportMeta.generatedBy || "System"
    worksheet.getCell(currentRow, 2).style = infoStyle
    currentRow++

    // Empty row
    currentRow++

    // Column headers
    const headerRow = worksheet.getRow(currentRow)
    headerRow.height = 25
    columns.forEach((col, idx) => {
      const cell = worksheet.getCell(currentRow, idx + 1)
      cell.value = col
      cell.style = headerStyle
    })
    currentRow++

    // Data rows
    reportData.forEach((row, rowIdx) => {
      const isSeparator = Object.values(row).some((val) => String(val) === "---")
      const dataRow = worksheet.getRow(currentRow)

      if (isSeparator) {
        dataRow.height = 20
      } else {
        dataRow.height = 18
        // Alternate row colors for better readability
        if (rowIdx % 2 === 0) {
          dataRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFfafafa" },
          }
        }
      }

      columns.forEach((col, colIdx) => {
        const cell = worksheet.getCell(currentRow, colIdx + 1)
        const value = row[col] ?? ""
        cell.value = value
        cell.style = isSeparator ? separatorStyle : dataStyle
        cell.alignment = { ...dataStyle.alignment, wrapText: true }
      })
      currentRow++
    })

    // Auto-size columns
    columns.forEach((col, idx) => {
      let maxLength = col.length
      reportData.forEach((row) => {
        const value = String(row[col] ?? "")
        if (value.length > maxLength) maxLength = value.length
      })
      worksheet.getColumn(idx + 1).width = Math.min(Math.max(maxLength + 3, 12), 50)
    })

    // Freeze header row
    worksheet.views = [
      {
        state: "frozen",
        ySplit: currentRow - reportData.length - 1, // Freeze at header row
      },
    ]

    // Add metadata sheet
    const metaSheet = workbook.addWorksheet("Metadata")
    metaSheet.getColumn(1).width = 25
    metaSheet.getColumn(2).width = 40

    let metaRow = 1
    metaSheet.getCell(metaRow, 1).value = "REPORT INFORMATION"
    metaSheet.getCell(metaRow, 1).style = {
      font: { name: "Arial", size: 14, bold: true, color: { argb: "FF1e40af" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFe0e7ff" },
      },
    }
    metaRow += 2

    const metaData = [
      ["Report Title", reportMeta.title],
      ["Report Date", reportMeta.date || new Date().toLocaleDateString()],
      ["Generated", new Date().toLocaleString()],
    ]
    if (reportMeta.dateRange) {
      metaData.push(["Period From", reportMeta.dateRange.from])
      metaData.push(["Period To", reportMeta.dateRange.to])
    }
    if (reportMeta.generatedBy) {
      metaData.push(["Generated By", reportMeta.generatedBy])
    }
    metaData.push(["Total Records", reportData.length])

    metaData.forEach(([label, value]) => {
      metaSheet.getCell(metaRow, 1).value = label
      metaSheet.getCell(metaRow, 1).style = { font: { name: "Arial", size: 10, bold: true } }
      metaSheet.getCell(metaRow, 2).value = value
      metaSheet.getCell(metaRow, 2).style = { font: { name: "Arial", size: 10 } }
      metaRow++
    })

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Create blob and download
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    const filename = `${reportMeta.title.replace(/\s+/g, "_")}_${formatDateForFilename()}.xlsx`
    saveAs(blob, filename)
  } catch (error) {
    console.error("Excel export error:", error)
    throw new Error("Failed to export Excel file")
  }
}

// PDF Export
export const exportReportToPDF = async (
  reportData: ReportDataRow[],
  reportMeta: ReportMeta,
  columns: string[]
) => {
  try {
    const { pdf } = await import("@react-pdf/renderer")
    const blob = await pdf(<PDFDocument reportData={reportData} reportMeta={reportMeta} columns={columns} />).toBlob()
    const filename = `${reportMeta.title.replace(/\s+/g, "_")}_${formatDateForFilename()}.pdf`
    saveAs(blob, filename)
  } catch (error) {
    console.error("PDF export error:", error)
    throw new Error("Failed to export PDF file")
  }
}

// Transform existing report data to GenerateReport format
export const transformReportData = (
  reportType: string,
  data: any,
  dateRange: { from: string; to: string }
): { reportData: ReportDataRow[]; reportMeta: ReportMeta } => {
  const reportMeta: ReportMeta = {
    title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
    date: new Date().toLocaleDateString(),
    logo: "/Logo GTV Motor eng&kh.png",
    generatedBy: "System",
    dateRange: {
      from: dateRange.from,
      to: dateRange.to,
    },
  }

  let reportData: ReportDataRow[] = []

  switch (reportType) {
    case "summary":
      // Create a unified structure for summary report
      const summaryRows: ReportDataRow[] = []

      // Add summary metrics section
      if (data) {
        summaryRows.push({
          "Section": "SUMMARY METRICS",
          "Metric": "Total Revenue",
          "Value": `$${(Number(data.totalRevenue) || 0).toFixed(2)}`,
        })
        summaryRows.push({
          "Section": "",
          "Metric": "Total Services",
          "Value": String(data.totalServices || 0),
        })
        summaryRows.push({
          "Section": "",
          "Metric": "Average Service Value",
          "Value": `$${(Number(data.averageServiceValue) || 0).toFixed(2)}`,
        })
        summaryRows.push({
          "Section": "",
          "Metric": "Top Service",
          "Value": data.topService || "N/A",
        })
        summaryRows.push({
          "Section": "",
          "Metric": "Customer Growth",
          "Value": `${(Number(data.customerGrowth) || 0).toFixed(2)}%`,
        })
      }

      // Add services by type section
      if (data?.servicesByType && Array.isArray(data.servicesByType) && data.servicesByType.length > 0) {
        summaryRows.push({
          "Section": "SERVICES BY TYPE",
          "Metric": "",
          "Value": "",
        })
        summaryRows.push(
          ...data.servicesByType.map((item: any) => ({
            "Section": "",
            "Metric": item.type || "N/A",
            "Value": `${item.count || 0} services - $${(Number(item.revenue) || 0).toFixed(2)}`,
          }))
        )
      }

      // Add monthly trend section
      if (data?.monthlyTrend && Array.isArray(data.monthlyTrend) && data.monthlyTrend.length > 0) {
        summaryRows.push({
          "Section": "MONTHLY TREND",
          "Metric": "",
          "Value": "",
        })
        summaryRows.push(
          ...data.monthlyTrend.map((item: any) => ({
            "Section": "",
            "Metric": item.month || "N/A",
            "Value": `${item.services || 0} services - $${(Number(item.revenue) || 0).toFixed(2)}`,
          }))
        )
      }

      reportData = summaryRows
      break

    case "warranty":
      // Add summary information first
      if (data?.summary) {
        reportData.push({
          "Metric": "Total Warranties",
          "Value": String(data.summary.totalWarranties || 0),
        })
        reportData.push({
          "Metric": "Active Warranties",
          "Value": String(data.summary.activeWarranties || 0),
        })
        reportData.push({
          "Metric": "Expired Warranties",
          "Value": String(data.summary.expiredWarranties || 0),
        })
        reportData.push({
          "Metric": "Expiring Soon",
          "Value": String(data.summary.expiringSoon || 0),
        })
        reportData.push({
          "Metric": "Total Cost Covered",
          "Value": `$${(Number(data.summary.totalCostCovered) || 0).toFixed(2)}`,
        })
        reportData.push({
          "Metric": "---",
          "Value": "---",
        })
      }

      // Add by status
      if (data?.byStatus && Array.isArray(data.byStatus) && data.byStatus.length > 0) {
        reportData.push(
          ...data.byStatus.map((item: any) => ({
            Status: item.status || "N/A",
            Count: item.count || 0,
            "Total Cost": `$${(Number(item.totalCost) || 0).toFixed(2)}`,
          }))
        )
      }

      // Add claims
      if (data?.claims && Array.isArray(data.claims) && data.claims.length > 0) {
        if (reportData.length > 0) {
          reportData.push({
            "Claim Date": "---",
            Description: "---",
            Amount: "---",
            Status: "---",
            Customer: "---",
            Vehicle: "---",
          })
        }
        reportData.push(
          ...data.claims.map((item: any) => ({
            "Claim Date": item.claimDate ? new Date(item.claimDate).toLocaleDateString() : "N/A",
            Description: item.description || "N/A",
            Amount: `$${(Number(item.amount) || 0).toFixed(2)}`,
            Status: item.status || "N/A",
            Customer: item.customerName || "N/A",
            Vehicle: item.vehiclePlate || "N/A",
          }))
        )
      }

      // Add monthly trend
      if (data?.monthlyTrend && Array.isArray(data.monthlyTrend) && data.monthlyTrend.length > 0) {
        if (reportData.length > 0) {
          reportData.push({
            Status: "---",
            Count: "---",
            "Total Cost": "---",
          })
        }
        reportData.push(
          ...data.monthlyTrend.map((item: any) => ({
            Status: item.month || "N/A",
            Count: item.newWarranties || 0,
            "Total Cost": `$${(Number(item.totalCost) || 0).toFixed(2)}`,
          }))
        )
      }
      break

    case "customer":
      // Add summary information first
      if (data?.summary) {
        reportData.push({
          "Metric": "Total Customers",
          "Value": String(data.summary.totalCustomers || 0),
        })
        reportData.push({
          "Metric": "Active Customers",
          "Value": String(data.summary.activeCustomers || 0),
        })
        reportData.push({
          "Metric": "Inactive Customers",
          "Value": String(data.summary.inactiveCustomers || 0),
        })
        reportData.push({
          "Metric": "Average Service Value",
          "Value": `$${(Number(data.summary.averageServiceValue) || 0).toFixed(2)}`,
        })
        if (data?.retention) {
          reportData.push({
            "Metric": "Repeat Customers",
            "Value": String(data.retention.repeatCustomers || 0),
          })
        }
        reportData.push({
          "Metric": "---",
          "Value": "---",
        })
      }

      // Add top customers
      if (data?.topCustomers && Array.isArray(data.topCustomers) && data.topCustomers.length > 0) {
        reportData.push(
          ...data.topCustomers.map((item: any) => ({
            Name: item.name || "N/A",
            Phone: item.phone || "N/A",
            Email: item.email || "N/A",
            "Total Services": item.totalServices || 0,
            "Total Spent": `$${(Number(item.totalSpent) || 0).toFixed(2)}`,
            "Average Service Cost": `$${(Number(item.averageServiceCost) || 0).toFixed(2)}`,
            "Last Service": item.lastServiceDate ? new Date(item.lastServiceDate).toLocaleDateString() : "N/A",
          }))
        )
      }

      // Add service preferences
      if (data?.servicePreferences && Array.isArray(data.servicePreferences) && data.servicePreferences.length > 0) {
        if (reportData.length > 0) {
          reportData.push({
            Name: "---",
            Phone: "---",
            Email: "---",
            "Total Services": "---",
            "Total Spent": "---",
            "Average Service Cost": "---",
            "Last Service": "---",
          })
        }
        reportData.push(
          ...data.servicePreferences.map((item: any) => ({
            Name: item.serviceType || "N/A",
            Phone: String(item.serviceCount || 0),
            Email: String(item.uniqueCustomers || 0),
            "Total Services": "---",
            "Total Spent": "---",
            "Average Service Cost": "---",
            "Last Service": "---",
          }))
        )
      }
      break

    case "inventory":
      // Add summary information first
      if (data?.summary) {
        reportData.push({
          "Metric": "Total Items",
          "Value": String(data.summary.totalItems || 0),
        })
        reportData.push({
          "Metric": "Total Quantity",
          "Value": String(data.summary.totalQuantity || 0),
        })
        reportData.push({
          "Metric": "Total Value",
          "Value": `$${(Number(data.summary.totalValue) || 0).toFixed(2)}`,
        })
        reportData.push({
          "Metric": "Average Unit Price",
          "Value": `$${(Number(data.summary.averageUnitPrice) || 0).toFixed(2)}`,
        })
        reportData.push({
          "Metric": "---",
          "Value": "---",
        })
      }

      // Add by category
      if (data?.byCategory && Array.isArray(data.byCategory) && data.byCategory.length > 0) {
        reportData.push(
          ...data.byCategory.map((item: any) => ({
            Category: item.category || "N/A",
            "Item Count": item.itemCount || 0,
            "Total Value": `$${(Number(item.totalValue) || 0).toFixed(2)}`,
            "Average Price": `$${((Number(item.totalValue) || 0) / (Number(item.itemCount) || 1)).toFixed(2)}`,
          }))
        )
      }

      // Add low stock items
      if (data?.lowStock && Array.isArray(data.lowStock) && data.lowStock.length > 0) {
        if (reportData.length > 0) {
          reportData.push({
            Category: "---",
            "Item Count": "---",
            "Total Value": "---",
            "Average Price": "---",
          })
        }
        reportData.push(
          ...data.lowStock.map((item: any) => ({
            Category: item.category || "N/A",
            "Item Count": item.itemName || "N/A",
            "Total Value": String(item.quantity || 0),
            "Average Price": String(item.reorderLevel || 0),
            "Item Name": item.itemName || "N/A",
            Quantity: item.quantity || 0,
            "Reorder Level": item.reorderLevel || 0,
            "Unit Price": `$${(Number(item.unitPrice) || 0).toFixed(2)}`,
          }))
        )
      }

      // Add monthly trend
      if (data?.monthlyTrend && Array.isArray(data.monthlyTrend) && data.monthlyTrend.length > 0) {
        if (reportData.length > 0) {
          reportData.push({
            Category: "---",
            "Item Count": "---",
            "Total Value": "---",
            "Average Price": "---",
          })
        }
        reportData.push(
          ...data.monthlyTrend.map((item: any) => ({
            Category: item.month || "N/A",
            "Item Count": item.newItems || 0,
            "Total Value": String(item.totalQuantity || 0),
            "Average Price": `$${(Number(item.totalValue) || 0).toFixed(2)}`,
          }))
        )
      }
      break

    default:
      reportData = []
  }

  // If still no data, add a placeholder
  if (reportData.length === 0) {
    reportData.push({
      "Message": "No data available for this report",
      "Note": "Please ensure data has been loaded before exporting",
    })
  }

  return { reportData, reportMeta }
}

