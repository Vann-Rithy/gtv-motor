/**
 * Example usage of the GenerateReport component
 *
 * This file demonstrates how to use the GenerateReport component
 * with sample data including Khmer text support.
 */

import GenerateReport, { ReportDataRow, ReportMeta, ChartData } from "./GenerateReport"

// Example report data
const exampleReportData: ReportDataRow[] = [
  {
    "Customer Name": "សុខា ម៉ាលី",
    "Service Type": "Oil Change",
    "Amount": 50.00,
    "Date": "2024-01-15",
    "Status": "Completed"
  },
  {
    "Customer Name": "វិចិត្រ សុខុម",
    "Service Type": "Brake Repair",
    "Amount": 150.00,
    "Date": "2024-01-16",
    "Status": "Completed"
  },
  {
    "Customer Name": "សុខុម វិចិត្រ",
    "Service Type": "Tire Replacement",
    "Amount": 200.00,
    "Date": "2024-01-17",
    "Status": "Pending"
  }
]

// Example report metadata
const exampleReportMeta: ReportMeta = {
  title: "Monthly Service Report",
  date: "January 2024",
  logo: "/Logo GTV Motor eng&kh.png", // Path to your logo
  generatedBy: "System Administrator",
  dateRange: {
    from: "2024-01-01",
    to: "2024-01-31"
  }
}

// Example chart data
const exampleChartData: ChartData = {
  type: "bar",
  title: "Service Revenue by Type",
  data: [
    { name: "Oil Change", value: 500 },
    { name: "Brake Repair", value: 1500 },
    { name: "Tire Replacement", value: 2000 },
    { name: "Engine Repair", value: 3000 }
  ],
  colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
}

// Example component usage
export default function ExampleReportPage() {
  return (
    <div className="container mx-auto p-6">
      <GenerateReport
        reportData={exampleReportData}
        reportMeta={exampleReportMeta}
        chartData={exampleChartData}
        columns={["Customer Name", "Service Type", "Amount", "Date", "Status"]} // Optional: specify column order
      />
    </div>
  )
}

/**
 * Usage Notes:
 *
 * 1. reportData: Array of objects where each object represents a table row
 *    - Keys become column headers
 *    - Values can be strings, numbers, or null/undefined
 *    - Supports Khmer text in all export formats
 *
 * 2. reportMeta: Metadata for the report header
 *    - title: Main report title
 *    - date: Optional date string
 *    - logo: Optional path to logo image
 *    - generatedBy: Optional name of person/system generating report
 *    - dateRange: Optional date range object
 *
 * 3. chartData: Optional chart to display
 *    - type: "bar" or "pie"
 *    - title: Chart title
 *    - data: Array of data points with at least "name" and "value"
 *    - colors: Optional array of colors for chart elements
 *
 * 4. columns: Optional array to specify column order
 *    - If not provided, uses all keys from first reportData row
 *    - Useful for controlling column display order
 *
 * Export Features:
 * - CSV: Includes UTF-8 BOM for proper Khmer text display in Excel
 * - Excel: Full spreadsheet with metadata sheet, preserves Khmer text
 * - PDF: Professional A4 format with header, table, and footer
 *
 * All exports include automatic filename with date: Report_YYYYMMDD
 */

