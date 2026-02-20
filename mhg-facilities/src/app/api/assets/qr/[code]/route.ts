import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { AssetService } from '@/services/asset.service'

interface RouteParams {
  params: Promise<{ code: string }>
}

/**
 * GET /api/assets/qr/[code]
 * Look up asset by QR code
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { code } = await params

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 })
    }

    const service = new AssetService()
    const asset = await service.getAssetByQRCode(code)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Error looking up asset by QR code:', error)
    return NextResponse.json(
      { error: 'Failed to look up asset' },
      { status: 500 }
    )
  }
}
