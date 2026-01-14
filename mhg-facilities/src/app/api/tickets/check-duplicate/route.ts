import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/services/ticket.service'
import { requireAuth } from '@/lib/auth/api-auth'
import { checkDuplicateSchema } from '@/lib/validations/ticket'

/**
 * POST /api/tickets/check-duplicate
 * Check for potential duplicate tickets before creating a new one
 *
 * Body should include:
 * - location_id: string
 * - asset_id: string | null
 * - title: string
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const body = await request.json()

    // Validate request body
    const validatedData = checkDuplicateSchema.parse(body)

    const service = new TicketService()
    const duplicates = await service.checkForDuplicates(
      validatedData.location_id,
      validatedData.asset_id ?? null,
      validatedData.title
    )

    return NextResponse.json({
      has_duplicates: duplicates.length > 0,
      duplicates,
    })
  } catch (error) {
    console.error('Error checking duplicates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check duplicates' },
      { status: 500 }
    )
  }
}
