import { NextResponse, type NextRequest } from 'next/server'
import { AssetService } from '@/services/asset.service'

interface RouteParams {
  params: Promise<{ code: string }>
}

/**
 * GET /qr/[code]
 * Public QR code redirect - no auth required.
 * QR codes are scanned by phone cameras which open a browser.
 * The user will hit the login wall on /assets/[id] if not authenticated.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params

    if (!code || code.trim().length === 0) {
      return NextResponse.redirect(new URL('/assets?qr_error=not_found', _request.url))
    }

    const service = new AssetService()
    const asset = await service.getAssetByQRCode(code)

    if (!asset) {
      return NextResponse.redirect(new URL('/assets?qr_error=not_found', _request.url))
    }

    return NextResponse.redirect(new URL(`/assets/${asset.id}`, _request.url), 302)
  } catch (error) {
    console.error('Error during QR code redirect:', error)
    return NextResponse.redirect(new URL('/assets?qr_error=not_found', _request.url))
  }
}
