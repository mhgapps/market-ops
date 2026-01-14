import { NextResponse, type NextRequest } from 'next/server'
import { AssetService } from '@/services/asset.service'
import { createAssetSchema, assetFilterSchema } from '@/lib/validations/assets-vendors'

// Helper to convert null to undefined
function nullToUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, value === null ? undefined : value])
  ) as T
}

/**
 * GET /api/assets
 * Get all assets with optional filters
 * Query params: category_id, location_id, vendor_id, status, search, warranty_expiring_days
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const rawFilters = {
      category_id: searchParams.get('category_id') || undefined,
      location_id: searchParams.get('location_id') || undefined,
      vendor_id: searchParams.get('vendor_id') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      warranty_expiring_days: searchParams.get('warranty_expiring_days') || undefined,
    }

    // Validate filters
    const validationResult = assetFilterSchema.safeParse(rawFilters)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const service = new AssetService()
    const assets = await service.getAllAssets(validationResult.data)

    return NextResponse.json({
      assets,
      total: assets.length,
    })
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

/**
 * POST /api/assets
 * Create new asset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = createAssetSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const service = new AssetService()
    // Convert null values to undefined for service layer
    const data = nullToUndefined(validationResult.data)
    const asset = await service.createAsset(data as any)

    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
