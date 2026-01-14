import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportColumn {
  header: string
  accessor: string
}

export interface PDFExportOptions {
  title: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
  filename?: string
  orientation?: 'portrait' | 'landscape'
  subtitle?: string
}

/**
 * Export data to PDF format using jsPDF
 */
export function exportToPDF(options: PDFExportOptions): void {
  const {
    title,
    columns,
    data,
    filename = 'export',
    orientation = 'portrait',
    subtitle,
  } = options

  const doc = new jsPDF({ orientation })

  // Title
  doc.setFontSize(18)
  doc.text(title, 14, 20)

  // Subtitle if provided
  let startY = 28
  if (subtitle) {
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(subtitle, 14, startY)
    startY += 8
  }

  // Generated date
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, startY)
  startY += 7

  // Table
  autoTable(doc, {
    startY,
    head: [columns.map((col) => col.header)],
    body: data.map((row) =>
      columns.map((col) => {
        const value = row[col.accessor]
        if (value === null || value === undefined) return ''
        if (value instanceof Date) return value.toLocaleDateString()
        if (
          typeof value === 'number' &&
          (col.accessor.includes('cost') ||
            col.accessor.includes('price') ||
            col.accessor.includes('value') ||
            col.accessor.includes('Value'))
        ) {
          return `$${value.toFixed(2)}`
        }
        return String(value)
      })
    ),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  })

  doc.save(`${filename}.pdf`)
}

// ============================================================
// CONVENIENCE EXPORTS FOR SPECIFIC REPORT TYPES
// ============================================================

/**
 * Export tickets report to PDF
 */
export function exportTicketsToPDF(
  tickets: Record<string, unknown>[],
  filename?: string
): void {
  const columns: ExportColumn[] = [
    { header: 'Title', accessor: 'title' },
    { header: 'Status', accessor: 'status' },
    { header: 'Priority', accessor: 'priority' },
    { header: 'Created', accessor: 'created_at' },
    { header: 'Location', accessor: 'location_name' },
    { header: 'Assigned To', accessor: 'assigned_to_name' },
  ]

  exportToPDF({
    title: 'Tickets Report',
    subtitle: `Total tickets: ${tickets.length}`,
    columns,
    data: tickets,
    filename: filename || `tickets-report-${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
  })
}

/**
 * Export assets report to PDF
 */
export function exportAssetsToPDF(
  assets: Record<string, unknown>[],
  filename?: string
): void {
  const columns: ExportColumn[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Serial Number', accessor: 'serial_number' },
    { header: 'Status', accessor: 'status' },
    { header: 'Location', accessor: 'location_name' },
    { header: 'Category', accessor: 'category_name' },
    { header: 'Purchase Price', accessor: 'purchase_price' },
    { header: 'Warranty Expires', accessor: 'warranty_expiration' },
  ]

  exportToPDF({
    title: 'Assets Report',
    subtitle: `Total assets: ${assets.length}`,
    columns,
    data: assets,
    filename: filename || `assets-report-${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
  })
}

/**
 * Export compliance documents report to PDF
 */
export function exportComplianceToPDF(
  documents: Record<string, unknown>[],
  filename?: string
): void {
  const columns: ExportColumn[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'document_type_name' },
    { header: 'Status', accessor: 'status' },
    { header: 'Location', accessor: 'location_name' },
    { header: 'Issue Date', accessor: 'issue_date' },
    { header: 'Expiration Date', accessor: 'expiration_date' },
  ]

  exportToPDF({
    title: 'Compliance Documents Report',
    subtitle: `Total documents: ${documents.length}`,
    columns,
    data: documents,
    filename: filename || `compliance-report-${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
  })
}

/**
 * Export PM schedules report to PDF
 */
export function exportPMSchedulesToPDF(
  schedules: Record<string, unknown>[],
  filename?: string
): void {
  const columns: ExportColumn[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Asset', accessor: 'asset_name' },
    { header: 'Frequency', accessor: 'frequency' },
    { header: 'Next Due', accessor: 'next_due_date' },
    { header: 'Last Completed', accessor: 'last_completed_at' },
    { header: 'Status', accessor: 'status' },
  ]

  exportToPDF({
    title: 'Preventive Maintenance Report',
    subtitle: `Total schedules: ${schedules.length}`,
    columns,
    data: schedules,
    filename: filename || `pm-report-${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
  })
}

/**
 * Export vendors report to PDF
 */
export function exportVendorsToPDF(
  vendors: Record<string, unknown>[],
  filename?: string
): void {
  const columns: ExportColumn[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Contact Name', accessor: 'contact_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Status', accessor: 'status' },
  ]

  exportToPDF({
    title: 'Vendors Report',
    subtitle: `Total vendors: ${vendors.length}`,
    columns,
    data: vendors,
    filename: filename || `vendors-report-${new Date().toISOString().split('T')[0]}`,
    orientation: 'portrait',
  })
}
