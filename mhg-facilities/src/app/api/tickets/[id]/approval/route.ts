import { NextRequest, NextResponse } from 'next/server'
import { CostApprovalService } from '@/services/cost-approval.service'
import { requireAuth } from '@/lib/auth/api-auth'
import {
  requestApprovalSchema,
  approveRequestSchema,
  denyRequestSchema,
} from '@/lib/validations/ticket'

/**
 * POST /api/tickets/[id]/approval
 * Request cost approval for a ticket
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
    const body = await request.json()

    // Validate request body
    const validatedData = requestApprovalSchema.parse(body)

    const service = new CostApprovalService()
    const approval = await service.requestApproval({
      ticket_id: id,
      estimated_cost: validatedData.estimated_cost,
      vendor_quote_path: validatedData.vendor_quote_path,
      requested_by: user.id,
      notes: validatedData.notes,
    })

    return NextResponse.json({ approval }, { status: 201 })
  } catch (error) {
    console.error('Error requesting approval:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof Error && error.message.includes('already has')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to request approval' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tickets/[id]/approval
 * Approve or deny a cost approval request
 *
 * Body should include:
 * - action: 'approve' | 'deny'
 * - reason: string (required for deny)
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

    const service = new CostApprovalService()
    let approval

    switch (action) {
      case 'approve':
        approveRequestSchema.parse(data) // Validate (currently empty schema)
        approval = await service.approveRequest(id, user.id)
        break

      case 'deny': {
        const validatedData = denyRequestSchema.parse(data)
        approval = await service.denyRequest(id, user.id, validatedData.reason)
        break
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ approval })
  } catch (error) {
    console.error('Error processing approval:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof Error && error.message.includes('already')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Only')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process approval' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tickets/[id]/approval
 * Get cost approval request for a ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const { id } = await params
    const service = new CostApprovalService()
    const approval = await service.getApprovalById(id)

    if (!approval) {
      return NextResponse.json(
        { error: 'No approval request found for this ticket' },
        { status: 404 }
      )
    }

    return NextResponse.json({ approval })
  } catch (error) {
    console.error('Error fetching approval:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch approval' },
      { status: 500 }
    )
  }
}
