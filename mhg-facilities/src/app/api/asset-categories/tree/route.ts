import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { AssetCategoryService } from '@/services/asset-category.service'

/**
 * GET /api/asset-categories/tree
 * Get hierarchical asset categories
 */
export async function GET() {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const service = new AssetCategoryService()
    const tree = await service.getCategoryTree()

    return NextResponse.json({ tree })
  } catch (error) {
    console.error('Error fetching asset category tree:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset category tree' },
      { status: 500 }
    )
  }
}
