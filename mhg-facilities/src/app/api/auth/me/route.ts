import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TenantService } from '@/services/tenant.service'
import type { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row']

/**
 * GET /api/auth/me
 * Returns the current authenticated user and their tenant context
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get the auth user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Try to get user from our users table first
    let user: UserRow | null = null
    // Look up user by auth ID directly from users table
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .is('deleted_at', null)
      .single()

    if (!userError && dbUser) {
      user = dbUser as UserRow
    } else if (userError) {
      console.error('Error fetching user from users table:', userError.message, 'authUser.id:', authUser.id)
    }

    // Get tenant_id from user record or user metadata
    const tenantId = user?.tenant_id ?? authUser.user_metadata?.tenant_id

    if (!tenantId) {
      console.error('No tenant associated with user:', {
        authUserId: authUser.id,
        authUserEmail: authUser.email,
        userFound: !!user,
        userTenantId: user?.tenant_id ?? null,
        userMetadataTenantId: authUser.user_metadata?.tenant_id ?? null,
        userError: userError?.message ?? null,
      })
      return NextResponse.json(
        { error: 'No tenant associated with user. Please contact support.' },
        { status: 400 }
      )
    }

    // Get tenant information
    const tenantService = new TenantService()
    const tenant = await tenantService.getTenantById(tenantId)

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Build response with user and tenant context
    return NextResponse.json({
      user: user
        ? {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            phone: user.phone,
            locationId: user.location_id,
            languagePreference: user.language_preference,
            isActive: user.is_active,
            notificationPreferences: user.notification_preferences,
          }
        : {
            id: authUser.id,
            email: authUser.email,
            fullName: authUser.user_metadata?.full_name ?? 'User',
            role: 'admin',
            phone: null,
            locationId: null,
            languagePreference: 'en',
            isActive: true,
            notificationPreferences: { email: true, sms: false, push: false },
          },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
        features: tenant.features,
        branding: tenant.branding,
        limits: {
          maxUsers: tenant.max_users,
          maxLocations: tenant.max_locations,
          storageGb: tenant.storage_limit_gb,
        },
      },
    })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
