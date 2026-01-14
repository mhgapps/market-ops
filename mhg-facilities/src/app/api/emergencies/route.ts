import { NextRequest, NextResponse } from 'next/server'
import { EmergencyIncidentService } from '@/services/emergency-incident.service'
import { requireAuth } from '@/lib/auth/api-auth'
import { z } from 'zod'
import { uuid } from '@/lib/validations/shared'

// Validation schemas
const createIncidentSchema = z.object({
  location_id: uuid('Invalid location ID'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  severity: z.enum(['high', 'critical']),
})

const filterSchema = z.object({
  status: z.enum(['active', 'contained', 'resolved']).optional(),
  location_id: uuid().optional(),
  days: z.coerce.number().int().positive().optional(),
})

/**
 * GET /api/emergencies
 * Get emergency incidents with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)

    // Parse filters from query params
    const filters = {
      status: searchParams.get('status') || undefined,
      location_id: searchParams.get('location_id') || undefined,
      days: searchParams.get('days') || undefined,
    }

    // Validate filters
    const validatedFilters = filterSchema.parse(filters)

    const service = new EmergencyIncidentService()

    let incidents

    if (validatedFilters.status) {
      incidents = await service.getIncidentsByStatus(validatedFilters.status)
    } else if (validatedFilters.location_id) {
      incidents = await service.getIncidentsByLocation(validatedFilters.location_id)
    } else if (validatedFilters.days) {
      incidents = await service.getRecentIncidents(validatedFilters.days)
    } else {
      // Default to recent incidents (30 days)
      incidents = await service.getRecentIncidents(30)
    }

    // Also return stats
    const stats = await service.getIncidentStats()

    return NextResponse.json({ incidents, stats })
  } catch (error) {
    console.error('Error fetching emergency incidents:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch incidents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/emergencies
 * Create a new emergency incident
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validatedData = createIncidentSchema.parse(body)

    const service = new EmergencyIncidentService()
    const incident = await service.createIncident({
      ...validatedData,
      reported_by: user.id,
    })

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error) {
    console.error('Error creating emergency incident:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create incident' },
      { status: 500 }
    )
  }
}
