import { TicketAttachmentDAO, type AttachmentType } from '@/dao/ticket-attachment.dao'
import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import type { Database } from '@/types/database'

type TicketAttachment = Database['public']['Tables']['ticket_attachments']['Row']

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_TOTAL_SIZE_PER_TICKET = 200 * 1024 * 1024 // 200MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export interface UploadAttachmentInput {
  ticket_id: string
  file: File
  user_id: string
  attachment_type: AttachmentType
}

/**
 * Ticket Attachment Service
 * Handles business logic for ticket attachments and file uploads
 */
export class TicketAttachmentService {
  constructor(private attachmentDAO = new TicketAttachmentDAO()) {}

  /**
   * Get all attachments for a ticket
   */
  async getAttachments(ticketId: string) {
    return this.attachmentDAO.findByTicketId(ticketId)
  }

  /**
   * Upload attachment to Supabase storage and create database record
   */
  async uploadAttachment(input: UploadAttachmentInput): Promise<TicketAttachment> {
    const { ticket_id, file, user_id, attachment_type } = input

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('File type not allowed. Please upload images, PDFs, or Office documents.')
    }

    // Check total size for ticket
    const totalSize = await this.attachmentDAO.getTotalSizeByTicketId(ticket_id)
    if (totalSize + file.size > MAX_TOTAL_SIZE_PER_TICKET) {
      throw new Error(`Total attachments size for this ticket would exceed ${MAX_TOTAL_SIZE_PER_TICKET / 1024 / 1024}MB`)
    }

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `tickets/${ticket_id}/${timestamp}-${sanitizedName}`

    // Upload to Supabase storage
    const supabase = await getPooledSupabaseClient()
    const { error: uploadError } = await supabase.storage
      .from('ticket-attachments')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Create database record
    try {
      return await this.attachmentDAO.createAttachment({
        ticket_id,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size_bytes: file.size,
        uploaded_by: user_id,
        attachment_type,
      })
    } catch (error) {
      // If database record creation fails, delete the uploaded file
      await supabase.storage.from('ticket-attachments').remove([filePath])
      throw error
    }
  }

  /**
   * Delete attachment (soft delete in DB and remove from storage)
   */
  async deleteAttachment(attachmentId: string, userId: string, userRole: string): Promise<void> {
    // Get attachment to verify ownership and get file path
    const attachment = await this.attachmentDAO.findById(attachmentId) as TicketAttachment | null
    if (!attachment) {
      throw new Error('Attachment not found')
    }

    // Check permissions: must be uploader or admin
    if (attachment.uploaded_by !== userId && userRole !== 'admin') {
      throw new Error('You do not have permission to delete this attachment')
    }

    // Soft delete database record
    await this.attachmentDAO.softDelete(attachmentId)

    // Delete from storage
    const supabase = await getPooledSupabaseClient()
    const { error } = await supabase.storage
      .from('ticket-attachments')
      .remove([attachment.file_path])

    if (error) {
      console.error('Failed to delete file from storage:', error)
      // Don't throw - the database record is already soft deleted
    }
  }

  /**
   * Get signed URL for viewing/downloading attachment
   */
  async getSignedUrl(attachmentId: string, expiresIn = 3600): Promise<string> {
    const attachment = await this.attachmentDAO.findById(attachmentId) as TicketAttachment | null
    if (!attachment) {
      throw new Error('Attachment not found')
    }

    const supabase = await getPooledSupabaseClient()
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .createSignedUrl(attachment.file_path, expiresIn)

    if (error || !data) {
      throw new Error('Failed to generate signed URL')
    }

    return data.signedUrl
  }

  /**
   * Get attachments by type
   */
  async getAttachmentsByType(ticketId: string, type: AttachmentType) {
    return this.attachmentDAO.findByTicketIdAndType(ticketId, type)
  }
}
