import { NextRequest, NextResponse } from 'next/server'
import { InvitationService } from '@/services/invitation.service'
import { requireAdmin } from '@/lib/auth/api-auth'
import { z } from 'zod'
import { uuidRegex } from '@/lib/validations/shared'

const idParamSchema = z.string().regex(uuidRegex, 'Invalid invitation ID format')

/**
 * PATCH /api/invitations/manage/[id]
 * Cancel (soft delete) an invitation
 * Requires admin role
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const validation = idParamSchema.safeParse(id)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid invitation ID format' },
        { status: 400 }
      )
    }

    const invitationService = new InvitationService()
    await invitationService.cancelInvitation(validation.data)

    return NextResponse.json({ message: 'Invitation cancelled' })
  } catch (error) {
    console.error('Error in PATCH /api/invitations/manage/[id]:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel invitation' },
      { status: 500 }
    )
  }
}
