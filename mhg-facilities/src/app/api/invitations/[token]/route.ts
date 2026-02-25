import { NextRequest, NextResponse } from 'next/server'
import { InvitationService } from '@/services/invitation.service'
import { DeviceAuthService } from '@/services/device-auth.service'
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
 * Accept an invitation and create account (passwordless).
 * Public endpoint (no auth required).
 *
 * Creates the user without a password, sets must_set_password flag,
 * trusts the current device, and returns a session.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()

    // Validate request body (password no longer required)
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
      full_name: validation.data.full_name,
    })

    const userRecord = user as { id: string; email: string; full_name: string; role: string; tenant_id: string; auth_user_id: string }

    // Trust the device automatically for the new user
    const deviceAuthService = new DeviceAuthService()
    const userAgent = request.headers.get('user-agent') || ''
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0'

    let rawToken: string | null = null
    if (userRecord.auth_user_id) {
      rawToken = await deviceAuthService.trustDevice({
        userId: userRecord.id,
        tenantId: userRecord.tenant_id,
        authUserId: userRecord.auth_user_id,
        userAgent,
        ip,
      })
    }

    const response = NextResponse.json(
      {
        user: {
          id: userRecord.id,
          email: userRecord.email,
          fullName: userRecord.full_name,
          role: userRecord.role,
          mustSetPassword: true,
        },
        session,
      },
      { status: 201 }
    )

    // Set the device_token cookie if trust succeeded
    if (rawToken) {
      response.cookies.set('device_token', rawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 180 * 24 * 60 * 60, // 180 days in seconds
        path: '/',
      })
    }

    return response
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
