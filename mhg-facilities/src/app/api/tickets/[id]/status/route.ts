import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/services/ticket.service'
import { requireAuth } from '@/lib/auth/api-auth'
import {
  completeTicketSchema,
  rejectTicketSchema,
  holdTicketSchema,
} from '@/lib/validations/ticket'

/**
 * PATCH /api/tickets/[id]/status
 * Handle ticket status transitions
 *
 * Body should include:
 * - action: 'acknowledge' | 'start_work' | 'complete' | 'verify' | 'close' | 'reject' | 'hold' | 'resume'
 * - Plus action-specific fields
 */
export async function PATCH(
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
    const body = await request.json()
    const { action, ...data } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const service = new TicketService()
    let ticket

    switch (action) {
      case 'acknowledge':
        ticket = await service.acknowledgeTicket(id, user.id)
        break

      case 'start_work':
        ticket = await service.startWork(id, user.id)
        break

      case 'complete': {
        const validatedData = completeTicketSchema.parse(data)
        ticket = await service.completeTicket(
          id,
          user.id,
          validatedData.actual_cost
        )
        break
      }

      case 'verify':
        ticket = await service.verifyCompletion(id, user.id)
        break

      case 'close':
        ticket = await service.closeTicket(id, user.id)
        break

      case 'reject': {
        const validatedData = rejectTicketSchema.parse(data)
        ticket = await service.rejectTicket(id, user.id, validatedData.reason)
        break
      }

      case 'hold': {
        const validatedData = holdTicketSchema.parse(data)
        ticket = await service.putOnHold(id, user.id, validatedData.reason)
        break
      }

      case 'resume':
        ticket = await service.resumeFromHold(id, user.id)
        break

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error updating ticket status:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof Error && error.message.includes('Only')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Cannot')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update ticket status' },
      { status: 500 }
    )
  }
}
