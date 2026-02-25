import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/api-auth'
import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'

const setPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

/**
 * POST /api/auth/set-password
 * Set password for first-time users (invited users who don't have one yet).
 * Also clears the must_set_password flag on the user record.
 * Requires authentication.
 */
export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const body = await request.json()

    const validation = setPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { password } = validation.data

    const supabase = await getPooledSupabaseClient()

    // Look up the auth_user_id for this user
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

    // Set the password via admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUserId,
      { password }
    )

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    // Clear the must_set_password flag
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ must_set_password: false, updated_at: new Date().toISOString() } as never)
      .eq('id', user!.id)

    if (userUpdateError) {
      console.error(
        `Failed to clear must_set_password for user ${user!.id}: ${userUpdateError.message}`
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/auth/set-password:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}
