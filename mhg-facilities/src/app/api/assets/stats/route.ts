import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { AssetService } from '@/services/asset.service'

/**
 * GET /api/assets/stats
 * Get aggregate asset statistics
 */
export async function GET() {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const service = new AssetService()
    const stats = await service.getAssetStats()

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching asset stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset stats' },
      { status: 500 }
    )
  }
}
