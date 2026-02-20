import { NextRequest, NextResponse } from 'next/server'
import { TicketCommentService } from '@/services/ticket-comment.service'
import { requireAuth } from '@/lib/auth/api-auth'
import { createCommentSchema } from '@/lib/validations/ticket'

/**
 * GET /api/tickets/[id]/comments
 * Get all comments for a ticket
 */
export async function GET(
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
    const service = new TicketCommentService()

    // Only managers and admins can see internal comments
    const { searchParams } = new URL(request.url)
    const includeInternal = ['manager', 'admin'].includes(user.role) && searchParams.get('include_internal') === 'true'

    const comments = await service.getComments(id, includeInternal)

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tickets/[id]/comments
 * Add a comment to a ticket
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
    const validatedData = createCommentSchema.parse(body)

    const service = new TicketCommentService()
    const comment = await service.addComment({
      ticket_id: id,
      user_id: user.id,
      comment: validatedData.comment,
      is_internal: validatedData.is_internal,
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error adding comment:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add comment' },
      { status: 500 }
    )
  }
}
