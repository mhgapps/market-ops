import { NextRequest, NextResponse } from 'next/server'
import { OnCallScheduleService } from '@/services/on-call-schedule.service'
import { requireAuth, requireManager } from '@/lib/auth/api-auth'
import { z } from 'zod'
import { uuid } from '@/lib/validations/shared'

// Validation schemas
const createScheduleSchema = z.object({
  user_id: uuid('Invalid user ID'),
  location_id: uuid('Invalid location ID').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  is_primary: z.boolean().optional(),
  notes: z.string().optional(),
})

const filterSchema = z.object({
  user_id: uuid().optional(),
  location_id: uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  current: z.enum(['true', 'false']).optional(),
})

/**
 * GET /api/on-call
 * Get on-call schedules with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)

    // Parse filters from query params
    const filters = {
      user_id: searchParams.get('user_id') || undefined,
      location_id: searchParams.get('location_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      current: searchParams.get('current') || undefined,
    }

    // Validate filters
    const validatedFilters = filterSchema.parse(filters)

    const service = new OnCallScheduleService()

    // Handle different filter scenarios
    if (validatedFilters.current === 'true') {
      // Get current on-call person(s)
      const currentOnCall = await service.getCurrentOnCall(validatedFilters.location_id)
      return NextResponse.json({
        schedules: currentOnCall ? [currentOnCall] : [],
        current: currentOnCall,
      })
    }

    let schedules

    if (validatedFilters.user_id) {
      schedules = await service.getSchedulesByUser(validatedFilters.user_id)
    } else if (validatedFilters.location_id) {
      schedules = await service.getSchedulesByLocation(validatedFilters.location_id)
    } else if (validatedFilters.start_date && validatedFilters.end_date) {
      schedules = await service.getSchedulesByDateRange(
        validatedFilters.start_date,
        validatedFilters.end_date
      )
    } else {
      // Return all schedules
      schedules = await service.getAllSchedules()
    }

    // Also return current on-call for convenience
    const currentOnCall = await service.getCurrentOnCall()

    return NextResponse.json({ schedules, current: currentOnCall })
  } catch (error) {
    console.error('Error fetching on-call schedules:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/on-call
 * Create a new on-call schedule (requires manager+)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireManager()
    if (error) return error
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validatedData = createScheduleSchema.parse(body)

    const service = new OnCallScheduleService()
    const schedule = await service.createSchedule(validatedData)

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error('Error creating on-call schedule:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof Error && error.message.includes('overlap')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
