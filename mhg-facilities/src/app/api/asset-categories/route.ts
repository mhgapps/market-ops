import { NextResponse, type NextRequest } from 'next/server'
import { AssetCategoryService } from '@/services/asset-category.service'
import { createAssetCategorySchema } from '@/lib/validations/assets-vendors'

/**
 * GET /api/asset-categories
 * Get all asset categories with parent relationships
 */
export async function GET() {
  try {
    const service = new AssetCategoryService()
    const categories = await service.getAllCategories()

    return NextResponse.json({
      categories,
      total: categories.length,
    })
  } catch (error) {
    console.error('Error fetching asset categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset categories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/asset-categories
 * Create new asset category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = createAssetCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const service = new AssetCategoryService()
    // Convert null to undefined for service layer
    const createData = {
      ...validationResult.data,
      parent_category_id:
        validationResult.data.parent_category_id === null
          ? undefined
          : validationResult.data.parent_category_id,
    }
    const category = await service.createCategory(createData)

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating asset category:', error)

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to create asset category' },
      { status: 500 }
    )
  }
}
