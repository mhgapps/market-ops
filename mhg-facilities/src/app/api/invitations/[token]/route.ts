import { NextRequest, NextResponse } from 'next/server'
import { InvitationService } from '@/services/invitation.service'
import { acceptInviteSchema } from '@/lib/validations/user'

/**
 * GET /api/invitations/[token]
 * Validate an invitation token
 * Public endpoint (no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const invitationService = new InvitationService()
    const invitation = await invitationService.getInvitationByToken(token)

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        tenantName: invitation.tenant_name,
        expiresAt: invitation.expires_at,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/invitations/[token]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/invitations/[token]
 * Accept an invitation and create account
 * Public endpoint (no auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()

    // Validate request body
    const validation = acceptInviteSchema.safeParse({
      token,
      ...body,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      )
    }

    const invitationService = new InvitationService()
    const { user, session } = await invitationService.acceptInvitation({
      token,
      password: validation.data.password,
      full_name: validation.data.full_name,
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
        session,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/invitations/[token]:', error)

    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
