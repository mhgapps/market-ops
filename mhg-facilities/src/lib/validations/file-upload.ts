import { z } from 'zod'

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  photo: 10 * 1024 * 1024,      // 10MB for photos
  document: 50 * 1024 * 1024,   // 50MB for documents
  manual: 100 * 1024 * 1024,    // 100MB for equipment manuals
} as const

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  photo: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  document: ['application/pdf', 'image/jpeg', 'image/png'],
  manual: ['application/pdf'],
} as const

// MIME type to extension mapping
const MIME_TO_EXTENSION: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/heic': ['heic'],
  'application/pdf': ['pdf'],
}

export type FileType = keyof typeof FILE_SIZE_LIMITS

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['photo', 'document', 'manual']),
})

// Validate file on server before storage upload
export function validateFileUpload(file: File, type: FileType): { valid: true } | { valid: false; error: string } {
  const maxSize = FILE_SIZE_LIMITS[type]
  const allowedTypes = ALLOWED_MIME_TYPES[type]

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    }
  }

  // Check MIME type
  if (!(allowedTypes as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed: ${allowedTypes.join(', ')}`,
    }
  }

  // Validate file extension matches MIME type (prevent spoofing)
  const extension = file.name.split('.').pop()?.toLowerCase()
  const validExtensions = MIME_TO_EXTENSION[file.type] ?? []

  if (!validExtensions.includes(extension ?? '')) {
    return {
      valid: false,
      error: 'File extension does not match file type',
    }
  }

  return { valid: true }
}

// Get storage path for file upload
export function getStoragePath(
  tenantId: string,
  bucket: string,
  entityId: string,
  filename: string
): string {
  // Sanitize filename
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${tenantId}/${entityId}/${sanitized}`
}

// Storage bucket configuration
export const STORAGE_BUCKETS = {
  ticketPhotos: 'ticket-photos',
  ticketDocuments: 'ticket-documents',
  complianceDocs: 'compliance-docs',
  assetPhotos: 'asset-photos',
  assetManuals: 'asset-manuals',
  vendorInvoices: 'vendor-invoices',
} as const
