import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/services/ticket.service'
import { requireAuth } from '@/lib/auth/api-auth'
import { updateTicketSchema } from '@/lib/validations/ticket'

/**
 * GET /api/tickets/[id]
 * Get ticket by ID with all relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { id } = await params
    const service = new TicketService()
    const ticket = await service.getTicketById(id)

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error fetching ticket:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tickets/[id]
 * Update ticket basic information
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = updateTicketSchema.parse(body)

    const service = new TicketService()
    const ticket = await service.updateTicket(id, validatedData)

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error updating ticket:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update ticket' },
      { status: 500 }
    )
  }
}
