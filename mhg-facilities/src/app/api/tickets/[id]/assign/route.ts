import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/services/ticket.service'
import { requireAuth } from '@/lib/auth/api-auth'
import { assignTicketSchema, assignVendorSchema } from '@/lib/validations/ticket'

/**
 * POST /api/tickets/[id]/assign
 * Assign ticket to staff member or vendor
 *
 * Body should include:
 * - assignee_id: string (for staff assignment)
 * OR
 * - vendor_id: string (for vendor assignment)
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

    // Only managers and admins can assign tickets
    if (user.role !== 'manager' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: manager or admin role required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const service = new TicketService()
    let ticket

    // Determine if assigning to staff or vendor
    if (body.assignee_id) {
      // Assign to staff member
      const validatedData = assignTicketSchema.parse({
        assignee_id: body.assignee_id,
        assigner_id: user.id,
      })

      ticket = await service.assignTicket(
        id,
        validatedData.assignee_id,
        validatedData.assigner_id
      )
    } else if (body.vendor_id) {
      // Assign to vendor
      const validatedData = assignVendorSchema.parse({
        vendor_id: body.vendor_id,
        assigner_id: user.id,
      })

      ticket = await service.assignToVendor(
        id,
        validatedData.vendor_id,
        validatedData.assigner_id
      )
    } else {
      return NextResponse.json(
        { error: 'Either assignee_id or vendor_id is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error assigning ticket:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof Error && error.message.includes('Cannot assign')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Can only assign')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to assign ticket' },
      { status: 500 }
    )
  }
}
