import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { AssetService } from '@/services/asset.service'
import { updateAssetSchema } from '@/lib/validations/assets-vendors'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/assets/[id]
 * Get asset by ID with relations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params

    const service = new AssetService()
    const asset = await service.getAssetById(id)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Error fetching asset:', error)
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 })
  }
}

/**
 * PATCH /api/assets/[id]
 * Update asset
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validationResult = updateAssetSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const service = new AssetService()
    const asset = await service.updateAsset(id, validationResult.data)

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Error updating asset:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
    }

    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

/**
 * DELETE /api/assets/[id]
 * Soft delete asset
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params

    const service = new AssetService()
    await service.deleteAsset(id)

    return NextResponse.json({ message: 'Asset deleted successfully' })
  } catch (error) {
    console.error('Error deleting asset:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
