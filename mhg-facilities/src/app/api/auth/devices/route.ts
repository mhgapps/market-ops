import { NextRequest, NextResponse } from 'next/server'
import { DeviceAuthService } from '@/services/device-auth.service'
import { requireAuth } from '@/lib/auth/api-auth'

/**
 * GET /api/auth/devices
 * List all trusted devices for the authenticated user.
 * Marks which device is the current one based on the cookie token hash.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const deviceAuthService = new DeviceAuthService()

    // Hash the current cookie token to identify the current device
    const deviceToken = request.cookies.get('device_token')?.value
    const currentTokenHash = deviceToken
      ? deviceAuthService.hashToken(deviceToken)
      : undefined

    const rawDevices = await deviceAuthService.listDevices(user!.id)

    // Format the devices and mark the current one
    const devices = rawDevices.map((device) => ({
      id: device.id,
      device_name: device.device_name,
      ip_address: device.ip_address,
      trusted_at: device.trusted_at,
      last_used_at: device.last_used_at,
      is_current: currentTokenHash
        ? device.device_token_hash === currentTokenHash
        : false,
    }))

    return NextResponse.json({ devices })
  } catch (error) {
    console.error('Error in GET /api/auth/devices:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/devices
 * Revoke ALL trusted devices for the authenticated user.
 * Clears the device_token cookie.
 * Requires authentication.
 */
export async function DELETE() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const deviceAuthService = new DeviceAuthService()
    await deviceAuthService.revokeAllDevices(user!.id)

    const response = NextResponse.json({ success: true })
    response.cookies.set('device_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error in DELETE /api/auth/devices:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}
