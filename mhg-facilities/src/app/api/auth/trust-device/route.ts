import { NextRequest, NextResponse } from 'next/server'
import { DeviceAuthService } from '@/services/device-auth.service'
import { requireAuth } from '@/lib/auth/api-auth'
import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'

/**
 * POST /api/auth/trust-device
 * Trust the current device after a successful password login.
 * Sets an httpOnly device_token cookie valid for 180 days.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    // Get auth_user_id from the users table
    const supabase = await getPooledSupabaseClient()
    const { data: userData } = await supabase
      .from('users')
      .select('auth_user_id')
      .eq('id', user!.id)
      .single()

    const authUserId = (userData as { auth_user_id: string | null } | null)?.auth_user_id
    if (!authUserId) {
      return NextResponse.json(
        { error: 'User auth link not found' },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent') || ''
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0'

    const deviceAuthService = new DeviceAuthService()
    const rawToken = await deviceAuthService.trustDevice({
      userId: user!.id,
      tenantId: user!.tenant_id,
      authUserId,
      userAgent,
      ip,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set('device_token', rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 180 * 24 * 60 * 60, // 180 days in seconds
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error in POST /api/auth/trust-device:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}
