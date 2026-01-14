import { NextRequest, NextResponse } from 'next/server'
import { TicketAttachmentService } from '@/services/ticket-attachment.service'
import { requireAuth } from '@/lib/auth/api-auth'
import { uploadAttachmentSchema } from '@/lib/validations/ticket'

/**
 * GET /api/tickets/[id]/attachments
 * Get all attachments for a ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { id } = await params
    const service = new TicketAttachmentService()
    const attachments = await service.getAttachments(id)

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tickets/[id]/attachments
 * Upload an attachment for a ticket
 *
 * Expects multipart/form-data with:
 * - file: The file to upload
 * - attachment_type: 'initial' | 'progress' | 'completion' | 'invoice' | 'quote'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const attachmentType = formData.get('attachment_type') as string

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    // Validate attachment type
    const validatedData = uploadAttachmentSchema.parse({
      attachment_type: attachmentType,
    })

    const service = new TicketAttachmentService()
    const attachment = await service.uploadAttachment({
      ticket_id: id,
      file,
      user_id: user.id,
      attachment_type: validatedData.attachment_type,
    })

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (error) {
    console.error('Error uploading attachment:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload attachment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tickets/[id]/attachments
 * Delete an attachment (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachment_id')

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      )
    }

    const service = new TicketAttachmentService()
    await service.deleteAttachment(attachmentId, user.id, user.role)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}
