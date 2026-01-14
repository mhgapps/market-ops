import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'
import { UserDAO } from '@/dao/user.dao'
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

    const userDAO = new UserDAO()
    const user = await userDAO.findById(id)

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

    // Check admin role if updating someone else or changing role
    if (!isOwnProfile || validation.data.role) {
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

    const userDAO = new UserDAO()

    // Update user
    const updatedUser = await userDAO.update(id, {
      full_name: validation.data.full_name,
      role: validation.data.role,
      location_id: validation.data.location_id,
      phone: validation.data.phone,
      language_preference: validation.data.language_preference,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notification_preferences: validation.data.notification_preferences as any,
    })

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
