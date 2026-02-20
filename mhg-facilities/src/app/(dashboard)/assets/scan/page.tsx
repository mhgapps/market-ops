'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRScanner } from '@/components/assets/qr-scanner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import api from '@/lib/api-client'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Spinner } from '@/components/ui/loaders'
import Link from 'next/link'

interface Asset {
  id: string
  name: string
  qr_code: string
  category?: {
    name: string
  } | null
  location?: {
    name: string
  } | null
}

export default function AssetScanPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async (qrCode: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Look up asset by QR code
      const data = await api.get<{ asset: Asset }>(`/api/assets/qr/${encodeURIComponent(qrCode)}`)

      // Redirect to asset detail page
      router.push(`/assets/${data.asset.id}`)
    } catch (_err) {
      // Asset not found
      setError(`Asset not found with QR code: ${qrCode}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/assets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Scan Asset QR Code</h1>
          <p className="text-muted-foreground">
            Use your device camera to scan an asset QR code
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2"
          >
            Try Again
          </Button>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Spinner size="lg" className="mx-auto text-primary" />
              <p className="text-muted-foreground">Looking up asset...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Camera Scanner</CardTitle>
            <CardDescription>
              Point your camera at an asset QR code to view its details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QRScanner onScan={handleScan} />
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          <strong>Note:</strong> Your browser will request camera permissions
          the first time you use this feature.
        </p>
        <p>
          If scanning doesn&apos;t work, make sure:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>You&apos;ve granted camera permissions</li>
          <li>The QR code is clearly visible and well-lit</li>
          <li>You&apos;re holding the camera steady</li>
        </ul>
      </div>
    </div>
  )
}
