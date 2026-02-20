import { NextRequest, NextResponse } from 'next/server'
import { TenantDAO } from '@/dao/tenant.dao'
import { requireAdmin } from '@/lib/auth/api-auth'

/**
 * PATCH /api/tenant
 * Update the current tenant's name
 * Requires admin role
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin()
    if (error) return error
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Organization name must be 100 characters or less' },
        { status: 400 }
      )
    }

    const tenantDAO = new TenantDAO()
    const tenant = await tenantDAO.update(user.tenant_id, { name: name.trim() })

    return NextResponse.json({ tenant })
  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to update tenant settings' },
      { status: 500 }
    )
  }
}
