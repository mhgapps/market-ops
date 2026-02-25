import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'
import { requireAuth, requireAdmin } from '@/lib/auth/api-auth'
import { updateUserSchema } from '@/lib/validations/user'

/**
 * GET /api/users/[id]
 * Get a specific user by ID
 * Requires admin role (or own user)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: currentUser, error } = await requireAuth()
    if (error) return error

    const { id } = await params

    // Allow users to view their own profile
    const isOwnProfile = currentUser?.id === id

    if (!isOwnProfile) {
      const { error: adminError } = await requireAdmin()
      if (adminError) return adminError
    }

    const userService = new UserService()
    const user = await userService.findById(id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Transform user for response
    const transformedUser = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      phone: user.phone,
      locationId: user.location_id,
      languagePreference: user.language_preference,
      isActive: user.is_active,
      notificationPreferences: user.notification_preferences,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Error in GET /api/users/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/[id]
 * Update a user
 * Requires admin role (or own user for limited fields)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: currentUser, error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      )
    }

    const isOwnProfile = currentUser?.id === id

    const isActiveChange = validation.data.is_active !== undefined

    // Check admin role if updating someone else, changing role, or changing active status
    if (!isOwnProfile || validation.data.role || isActiveChange) {
      const { error: adminError } = await requireAdmin()
      if (adminError) return adminError
    }

    // Prevent users from changing their own role
    if (isOwnProfile && validation.data.role) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 403 }
      )
    }

    // Prevent users from deactivating themselves
    if (isOwnProfile && validation.data.is_active === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 403 }
      )
    }

    const userService = new UserService()
    let updatedUser: Awaited<ReturnType<UserService['findById']>> | null = null

    // Update role via service if changing role (has validation logic)
    if (validation.data.role) {
      await userService.changeRole(id, validation.data.role)
    }

    // Update profile fields via service
    const hasProfileUpdates =
      validation.data.full_name !== undefined ||
      validation.data.phone !== undefined ||
      validation.data.location_id !== undefined ||
      validation.data.language_preference !== undefined ||
      validation.data.notification_preferences !== undefined

    if (hasProfileUpdates) {
      updatedUser = await userService.updateProfile(id, {
        fullName: validation.data.full_name,
        phone: validation.data.phone,
        locationId: validation.data.location_id,
        languagePreference: validation.data.language_preference as 'en' | 'es' | undefined,
        notificationPreferences: validation.data.notification_preferences as
          | { email: boolean; sms: boolean; push: boolean }
          | undefined,
      })
    }

    // Toggle active status if requested
    if (validation.data.is_active !== undefined) {
      updatedUser = validation.data.is_active
        ? await userService.reactivateUser(id)
        : await userService.deactivateUser(id)
    }

    // If only role changed, fetch latest record for response
    if (!updatedUser) {
      updatedUser = await userService.findById(id)
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Transform user for response
    const transformedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      role: updatedUser.role,
      phone: updatedUser.phone,
      locationId: updatedUser.location_id,
      languagePreference: updatedUser.language_preference,
      isActive: updatedUser.is_active,
      notificationPreferences: updatedUser.notification_preferences,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Error in PATCH /api/users/[id]:', error)

    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]
 * Soft delete a user (deactivate)
 * Requires admin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: currentUser, error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    // Prevent users from deactivating themselves
    if (currentUser?.id === id) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 403 }
      )
    }

    const userService = new UserService()
    await userService.deactivateUser(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/users/[id]:', error)

    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deactivate user' },
      { status: 500 }
    )
  }
}
