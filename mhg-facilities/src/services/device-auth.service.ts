import { TrustedDeviceDAO } from '@/dao/trusted-device.dao'
import type { TrustedDevice } from '@/dao/trusted-device.dao'
import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import { randomBytes, createHash } from 'crypto'

/**
 * Device Auth Service - Business logic for trusted device authentication
 *
 * Implements "remember this device" flow:
 * 1. User logs in with password -> device is trusted for 180 days
 * 2. On return visits, device token cookie is checked
 * 3. If valid, user is signed in via Supabase Admin magic link (no password)
 *
 * Security model:
 * - Raw token stored as httpOnly cookie on the client
 * - SHA-256 hash of the token stored in the database
 * - Even if the database is compromised, tokens cannot be reversed
 */
export class DeviceAuthService {
  constructor(private deviceDAO = new TrustedDeviceDAO()) {}

  /**
   * Trust a device after successful password authentication.
   * Generates a secure random token, stores its hash, and returns
   * the raw token to be set as an httpOnly cookie.
   */
  async trustDevice(params: {
    userId: string
    tenantId: string
    authUserId: string
    userAgent: string
    ip: string
  }): Promise<string> {
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = this.hashToken(rawToken)
    const deviceName = this.parseDeviceName(params.userAgent)

    await this.deviceDAO.create({
      tenant_id: params.tenantId,
      user_id: params.userId,
      auth_user_id: params.authUserId,
      device_token_hash: tokenHash,
      device_name: deviceName,
      ip_address: params.ip,
    })

    return rawToken
  }

  /**
   * Verify that a device token is valid and belongs to the user with the given email.
   * Returns the device record if valid, null otherwise.
   */
  async verifyDevice(
    email: string,
    deviceTokenRaw: string
  ): Promise<TrustedDevice | null> {
    const tokenHash = this.hashToken(deviceTokenRaw)

    const device = await this.deviceDAO.findByTokenHash(tokenHash)
    if (!device) return null

    // Verify the device belongs to the user with this email
    const supabase = await getPooledSupabaseClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, auth_user_id')
      .eq('id', device.user_id)
      .eq('email', email)
      .is('deleted_at', null)
      .single()

    if (error || !user) return null

    // Update last_used_at to track device activity
    await this.deviceDAO.updateLastUsed(device.id)

    return device
  }

  /**
   * Sign in a user via their trusted device (passwordless).
   *
   * Flow:
   * 1. Verify the device token is valid for the given email
   * 2. Generate a magic link via Supabase Admin API
   * 3. Immediately verify the OTP server-side to create a session
   * 4. Return the session tokens for the client
   *
   * Returns null if the device token is invalid or expired.
   */
  async signInWithTrustedDevice(
    email: string,
    deviceTokenRaw: string
  ): Promise<{
    session: { access_token: string; refresh_token: string }
    device: TrustedDevice
  } | null> {
    const device = await this.verifyDevice(email, deviceTokenRaw)
    if (!device) return null

    const supabase = await getPooledSupabaseClient()

    // Generate a magic link via Admin API (does not send an email)
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error(
        'Failed to generate magic link for trusted device auth:',
        linkError?.message
      )
      return null
    }

    // Verify the OTP server-side to create a session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: 'magiclink',
      })

    if (sessionError || !sessionData?.session) {
      console.error(
        'Failed to verify OTP for trusted device auth:',
        sessionError?.message
      )
      return null
    }

    return {
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
      device,
    }
  }

  /**
   * List all active (non-revoked, non-deleted) devices for a user.
   * Used in the device management settings UI.
   */
  async listDevices(userId: string): Promise<TrustedDevice[]> {
    return this.deviceDAO.findByUserId(userId)
  }

  /**
   * Revoke a specific trusted device.
   * Scoped by userId to prevent cross-user revocation.
   */
  async revokeDevice(deviceId: string, userId: string): Promise<void> {
    await this.deviceDAO.revoke(deviceId, userId)
  }

  /**
   * Revoke all trusted devices for a user.
   * Typically called when a user changes their password.
   */
  async revokeAllDevices(userId: string): Promise<void> {
    await this.deviceDAO.revokeAllForUser(userId)
  }

  /**
   * Hash a raw token with SHA-256.
   * The hash is stored in the database; the raw token is stored as a cookie.
   * Public so API routes can hash a cookie token to identify the current device.
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  /**
   * Parse a user-agent string into a friendly device name.
   * Returns a string like "Chrome on macOS" or "Safari on iOS".
   */
  private parseDeviceName(userAgent: string): string {
    const browser = this.parseBrowser(userAgent)
    const os = this.parseOS(userAgent)

    if (browser && os) return `${browser} on ${os}`
    if (browser) return browser
    if (os) return os
    return 'Unknown device'
  }

  private parseBrowser(ua: string): string | null {
    if (/Edg\//i.test(ua)) return 'Edge'
    if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome'
    if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari'
    if (/Firefox\//i.test(ua)) return 'Firefox'
    return null
  }

  private parseOS(ua: string): string | null {
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
    if (/Android/i.test(ua)) return 'Android'
    if (/Mac OS X|macOS/i.test(ua)) return 'macOS'
    if (/Windows/i.test(ua)) return 'Windows'
    if (/Linux/i.test(ua)) return 'Linux'
    return null
  }
}
