import { NextRequest, NextResponse } from 'next/server'
import { EmergencyIncidentService } from '@/services/emergency-incident.service'
import { requireAuth, requireManager } from '@/lib/auth/api-auth'
import { z } from 'zod'

// Validation schemas
const updateStatusSchema = z.object({
  action: z.enum(['contain', 'resolve']),
  resolution_notes: z.string().optional(),
})

const updateIncidentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  severity: z.enum(['high', 'critical']).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/emergencies/[id]
 * Get a specific emergency incident
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { id } = await params

    const service = new EmergencyIncidentService()
    const incident = await service.getIncidentById(id)

    return NextResponse.json({ incident })
  } catch (error) {
    console.error('Error fetching emergency incident:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch incident' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/emergencies/[id]
 * Update incident status (contain/resolve) or basic info
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requireManager()
    if (error) return error
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const service = new EmergencyIncidentService()

    // Check if this is a status update or a general update
    if (body.action) {
      const { action, resolution_notes } = updateStatusSchema.parse(body)

      let incident

      if (action === 'contain') {
        incident = await service.markContained(id)
      } else if (action === 'resolve') {
        if (!resolution_notes) {
          return NextResponse.json(
            { error: 'Resolution notes are required when resolving an incident' },
            { status: 400 }
          )
        }
        incident = await service.markResolved(id, resolution_notes)
      }

      return NextResponse.json({ incident })
    } else {
      // General update
      const validatedData = updateIncidentSchema.parse(body)
      const incident = await service.updateIncident(id, validatedData)
      return NextResponse.json({ incident })
    }
  } catch (error) {
    console.error('Error updating emergency incident:', error)

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
      { error: error instanceof Error ? error.message : 'Failed to update incident' },
      { status: 500 }
    )
  }
}
