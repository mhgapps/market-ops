import * as XLSX from 'xlsx'

export interface ExcelColumn {
  header: string
  accessor: string
  width?: number
}

export interface ExcelExportOptions {
  sheetName: string
  data: Record<string, unknown>[]
  filename?: string
  columns?: ExcelColumn[]
}

/**
 * Export data to Excel format using xlsx
 */
export function exportToExcel(options: ExcelExportOptions): void {
  const { sheetName, data, filename = 'export', columns } = options

  // Transform data if columns are specified
  let exportData: Record<string, unknown>[]
  let headers: string[]

  if (columns && columns.length > 0) {
    // Map data to specified columns with custom headers
    headers = columns.map((col) => col.header)
    exportData = data.map((row) => {
      const mappedRow: Record<string, unknown> = {}
      columns.forEach((col) => {
        const value = row[col.accessor]
        // Format currency values
        if (
          typeof value === 'number' &&
          (col.accessor.includes('cost') ||
            col.accessor.includes('price') ||
            col.accessor.includes('value') ||
            col.accessor.includes('Value'))
        ) {
          mappedRow[col.header] = value
        } else if (value instanceof Date) {
          mappedRow[col.header] = value.toLocaleDateString()
        } else {
          mappedRow[col.header] = value ?? ''
        }
      })
      return mappedRow
    })
  } else {
    // Use original data keys as headers
    exportData = data
    headers = data.length > 0 ? Object.keys(data[0]) : []
  }

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: headers })

  // Auto-size columns based on content
  const columnWidths: XLSX.ColInfo[] = []

  headers.forEach((header, index) => {
    // Start with header length
    let maxWidth = header.length

    // Check all data rows for max width
    exportData.forEach((row) => {
      const value = row[header]
      const cellLength = value ? String(value).length : 0
      if (cellLength > maxWidth) {
        maxWidth = cellLength
      }
    })

    // Use custom width if specified, otherwise use calculated width
    const customWidth = columns?.find((col) => col.header === header)?.width
    columnWidths[index] = { wch: customWidth || Math.min(maxWidth + 2, 50) }
  })

  worksheet['!cols'] = columnWidths

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Save file
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// ============================================================
// CONVENIENCE EXPORTS FOR SPECIFIC REPORT TYPES
// ============================================================

/**
 * Export tickets report to Excel
 */
export function exportTicketsToExcel(
  tickets: Record<string, unknown>[],
  filename?: string
): void {
  const columns: ExcelColumn[] = [
    { header: 'Title', accessor: 'title', width: 40 },
    { header: 'Description', accessor: 'description', width: 50 },
    { header: 'Status', accessor: 'status', width: 12 },
    { header: 'Priority', accessor: 'priority', width: 12 },
    { header: 'Created', accessor: 'created_at', width: 20 },
    { header: 'Location', accessor: 'location_name', width: 25 },
    { header: 'Category', accessor: 'category_name', width: 20 },
    { header: 'Assigned To', accessor: 'assigned_to_name', width: 25 },
    { header: 'Closed At', accessor: 'closed_at', width: 20 },
  ]

  exportToExcel({
    sheetName: 'Tickets',
    columns,
    data: tickets,
    filename: filename || `tickets-report-${new Date().toISOString().split('T')[0]}`,
  })
}

/**
 * Export assets report to Excel
 */
export function exportAssetsToExcel(
  assets: Record<string, unknown>[],
  filename?: string
): void {
  const columns: ExcelColumn[] = [
    { header: 'Name', accessor: 'name', width: 30 },
    { header: 'Description', accessor: 'description', width: 40 },
    { header: 'Serial Number', accessor: 'serial_number', width: 20 },
    { header: 'Model', accessor: 'model', width: 20 },
    { header: 'Manufacturer', accessor: 'manufacturer', width: 20 },
    { header: 'Status', accessor: 'status', width: 12 },
    { header: 'Location', accessor: 'location_name', width: 25 },
    { header: 'Category', accessor: 'category_name', width: 20 },
    { header: 'Purchase Date', accessor: 'purchase_date', width: 15 },
    { header: 'Purchase Price', accessor: 'purchase_price', width: 15 },
    { header: 'Warranty Expires', accessor: 'warranty_expiration', width: 18 },
  ]

  exportToExcel({
    sheetName: 'Assets',
    columns,
    data: assets,
    filename: filename || `assets-report-${new Date().toISOString().split('T')[0]}`,
  })
}

/**
 * Export compliance documents report to Excel
 */
export function exportComplianceToExcel(
  documents: Record<string, unknown>[],
  filename?: string
): void {
  const columns: ExcelColumn[] = [
    { header: 'Name', accessor: 'name', width: 35 },
    { header: 'Document Type', accessor: 'document_type_name', width: 25 },
    { header: 'Status', accessor: 'status', width: 12 },
    { header: 'Location', accessor: 'location_name', width: 25 },
    { header: 'Issue Date', accessor: 'issue_date', width: 15 },
    { header: 'Expiration Date', accessor: 'expiration_date', width: 18 },
    { header: 'Notes', accessor: 'notes', width: 40 },
  ]

  exportToExcel({
    sheetName: 'Compliance Documents',
    columns,
    data: documents,
    filename: filename || `compliance-report-${new Date().toISOString().split('T')[0]}`,
  })
}

/**
 * Export PM schedules report to Excel
 */
export function exportPMSchedulesToExcel(
  schedules: Record<string, unknown>[],
  filename?: string
): void {
  const columns: ExcelColumn[] = [
    { header: 'Name', accessor: 'name', width: 30 },
    { header: 'Description', accessor: 'description', width: 40 },
    { header: 'Asset', accessor: 'asset_name', width: 25 },
    { header: 'Frequency', accessor: 'frequency', width: 15 },
    { header: 'Next Due Date', accessor: 'next_due_date', width: 15 },
    { header: 'Last Completed', accessor: 'last_completed_at', width: 15 },
    { header: 'Status', accessor: 'status', width: 12 },
    { header: 'Estimated Cost', accessor: 'estimated_cost', width: 15 },
  ]

  exportToExcel({
    sheetName: 'PM Schedules',
    columns,
    data: schedules,
    filename: filename || `pm-report-${new Date().toISOString().split('T')[0]}`,
  })
}

/**
 * Export vendors report to Excel
 */
export function exportVendorsToExcel(
  vendors: Record<string, unknown>[],
  filename?: string
): void {
  const columns: ExcelColumn[] = [
    { header: 'Name', accessor: 'name', width: 30 },
    { header: 'Contact Name', accessor: 'contact_name', width: 25 },
    { header: 'Email', accessor: 'email', width: 30 },
    { header: 'Phone', accessor: 'phone', width: 18 },
    { header: 'Address', accessor: 'address', width: 35 },
    { header: 'Status', accessor: 'status', width: 12 },
    { header: 'Notes', accessor: 'notes', width: 40 },
  ]

  exportToExcel({
    sheetName: 'Vendors',
    columns,
    data: vendors,
    filename: filename || `vendors-report-${new Date().toISOString().split('T')[0]}`,
  })
}

/**
 * Export multiple sheets to a single Excel workbook
 */
export function exportMultipleSheetsToExcel(
  sheets: Array<{
    sheetName: string
    data: Record<string, unknown>[]
    columns?: ExcelColumn[]
  }>,
  filename?: string
): void {
  const workbook = XLSX.utils.book_new()

  sheets.forEach(({ sheetName, data, columns }) => {
    let exportData: Record<string, unknown>[]
    let headers: string[]

    if (columns && columns.length > 0) {
      headers = columns.map((col) => col.header)
      exportData = data.map((row) => {
        const mappedRow: Record<string, unknown> = {}
        columns.forEach((col) => {
          const value = row[col.accessor]
          if (
            typeof value === 'number' &&
            (col.accessor.includes('cost') ||
              col.accessor.includes('price') ||
              col.accessor.includes('value'))
          ) {
            mappedRow[col.header] = value
          } else if (value instanceof Date) {
            mappedRow[col.header] = value.toLocaleDateString()
          } else {
            mappedRow[col.header] = value ?? ''
          }
        })
        return mappedRow
      })
    } else {
      exportData = data
      headers = data.length > 0 ? Object.keys(data[0]) : []
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData, { header: headers })

    // Auto-size columns
    const columnWidths: XLSX.ColInfo[] = []
    headers.forEach((header, index) => {
      let maxWidth = header.length
      exportData.forEach((row) => {
        const value = row[header]
        const cellLength = value ? String(value).length : 0
        if (cellLength > maxWidth) {
          maxWidth = cellLength
        }
      })
      const customWidth = columns?.find((col) => col.header === header)?.width
      columnWidths[index] = { wch: customWidth || Math.min(maxWidth + 2, 50) }
    })
    worksheet['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })

  XLSX.writeFile(workbook, `${filename || 'export'}.xlsx`)
}
