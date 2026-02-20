import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/services/ticket.service'
import { requireAuth } from '@/lib/auth/api-auth'
import { createTicketSchema, ticketFiltersSchema } from '@/lib/validations/ticket'
import type { Database } from '@/types/database'

/**
 * GET /api/tickets
 * Get all tickets with optional filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)

    // Parse pagination params
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)

    // Parse filters from query params
    const isEmergencyParam = searchParams.get('is_emergency')
    const filters = {
      status: searchParams.get('status')?.split(',') as Database['public']['Enums']['ticket_status'][] | undefined,
      priority: searchParams.get('priority')?.split(',') as Database['public']['Enums']['ticket_priority'][] | undefined,
      location_id: searchParams.get('location_id') || undefined,
      assigned_to: searchParams.get('assigned_to') || undefined,
      submitted_by: searchParams.get('submitted_by') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      is_emergency: isEmergencyParam !== null ? isEmergencyParam === 'true' : undefined,
      page,
      pageSize,
    }

    // Validate filters
    const validatedFilters = ticketFiltersSchema.parse(filters)

    const service = new TicketService()
    const result = await service.getAllTicketsPaginated(validatedFilters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tickets
 * Create a new ticket
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Add submitted_by from authenticated user
    const ticketData = {
      ...body,
      submitted_by: user.id,
    }

    // Validate request body
    const validatedData = createTicketSchema.parse(ticketData)

    const service = new TicketService()
    const ticket = await service.createTicket(validatedData)

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
