import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { AssetTypeService } from '@/services/asset-type.service'
import { createAssetTypeSchema } from '@/lib/validations/assets-vendors'
import { uuid } from '@/lib/validations/shared'

/**
 * GET /api/asset-types
 * Get all asset types, optionally filtered by category_id
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const categoryId = request.nextUrl.searchParams.get('category_id')

    const service = new AssetTypeService()
    const assetTypes = categoryId
      ? await service.getTypesByCategory(uuid('Invalid category ID').parse(categoryId))
      : await service.getAllTypes()

    return NextResponse.json({
      assetTypes,
      total: assetTypes.length,
    })
  } catch (error) {
    console.error('Error fetching asset types:', error)

    if (error instanceof Error) {
      if (error.message.includes('Invalid category ID')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch asset types' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/asset-types
 * Create a new asset type
 */
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    const validationResult = createAssetTypeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const service = new AssetTypeService()
    const assetType = await service.createType(validationResult.data)

    return NextResponse.json({ assetType }, { status: 201 })
  } catch (error) {
    console.error('Error creating asset type:', error)

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to create asset type' },
      { status: 500 }
    )
  }
}
