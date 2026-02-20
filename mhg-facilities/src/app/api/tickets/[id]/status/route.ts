import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/services/ticket.service'
import { requireAuth } from '@/lib/auth/api-auth'
import {
  completeTicketSchema,
  rejectTicketSchema,
  holdTicketSchema,
} from '@/lib/validations/ticket'
import type { TicketStatus } from '@/types/database'

/**
 * PATCH /api/tickets/[id]/status
 * Handle ticket status transitions
 *
 * Status flow: submitted → in_progress → completed → closed
 * verified_at is a flag, not a status
 *
 * Body should include:
 * - action: 'start_work' | 'complete' | 'verify' | 'close' | 'reject' | 'hold' | 'resume' | 'set_status' | 'contain' | 'resolve'
 * - Plus action-specific fields
 * - For 'set_status': new_status (admin/manager only, allows any transition)
 * - For 'contain': (emergency tickets only) marks as contained
 * - For 'resolve': (emergency tickets only) notes required for resolution
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
        ticket = await service.closeTicket(id, user.id, {
          cost: data.cost,
          notes: data.notes,
        })
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

      case 'set_status': {
        if (user.role !== 'manager' && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Forbidden: manager or admin role required' },
            { status: 403 }
          )
        }
        const newStatus = data.new_status as TicketStatus
        if (!newStatus) {
          return NextResponse.json(
            { error: 'new_status is required for set_status action' },
            { status: 400 }
          )
        }
        ticket = await service.setStatus(id, user.id, newStatus)
        break
      }

      // Emergency-specific actions
      case 'contain':
        ticket = await service.containEmergency(id, user.id)
        break

      case 'resolve': {
        const notes = data.notes as string
        if (!notes) {
          return NextResponse.json(
            { error: 'notes is required for resolve action' },
            { status: 400 }
          )
        }
        ticket = await service.resolveEmergency(id, user.id, notes)
        break
      }

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
