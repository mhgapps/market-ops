'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Html5Qrcode as Html5QrcodeType } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, CameraOff, CheckCircle, XCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/loaders'

// Scanner state enum to avoid importing the library just for types
const ScannerState = {
  NOT_STARTED: 1,
  SCANNING: 2,
  PAUSED: 3,
} as const

interface QRScannerProps {
  onScan: (qrCode: string) => void | Promise<void>
  onClose?: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const scannerRef = useRef<Html5QrcodeType | null>(null)
  const scannerIdRef = useRef<string>('qr-scanner-region')
  const isProcessingRef = useRef(false)

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState()
        if (state === ScannerState.SCANNING || state === ScannerState.PAUSED) {
          await scannerRef.current.stop()
        }
      }
      setIsScanning(false)
    } catch (err) {
      console.error('Error stopping scanner:', err)
      setIsScanning(false)
    }
  }, [])

  const startScanner = async () => {
    try {
      setError(null)
      setSuccess(null)
      setIsLoading(true)

      // Dynamically import html5-qrcode only when scanner is activated (~50-60KB)
      const { Html5Qrcode, Html5QrcodeScannerState } = await import('html5-qrcode')

      setIsScanning(true)
      setIsLoading(false)

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerIdRef.current)
      }

      const scanner = scannerRef.current

      // Check if already scanning
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        return
      }

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // On successful scan - use ref to prevent race conditions
          if (!isProcessingRef.current) {
            isProcessingRef.current = true
            setIsProcessing(true)
            try {
              await onScan(decodedText)
              setSuccess(`Successfully scanned: ${decodedText}`)
              await stopScanner()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to process QR code')
            } finally {
              isProcessingRef.current = false
              setIsProcessing(false)
            }
          }
        },
        (_errorMessage) => {
          // Scanning errors (ignore these - they're normal during scanning)
        }
      )
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to start camera. Please ensure camera permissions are granted.'
      setError(errorMsg)
      setIsScanning(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        const state = scannerRef.current.getState()
        if (state === ScannerState.SCANNING || state === ScannerState.PAUSED) {
          scannerRef.current
            .stop()
            .catch((err) => console.error('Error stopping scanner on unmount:', err))
        }
      }
    }
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Scan QR Code</CardTitle>
        <CardDescription>
          Point your camera at an asset QR code to scan it
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scanner View */}
        <div className="relative">
          <div
            id={scannerIdRef.current}
            className="rounded-lg overflow-hidden border-2 border-gray-300"
            style={{ minHeight: isScanning ? 'auto' : '300px' }}
          />
          {!isScanning && !success && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center p-6">
                {isLoading ? (
                  <>
                    <Spinner size="lg" className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Loading camera...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Please wait while we initialize the scanner
                    </p>
                  </>
                ) : (
                  <>
                    <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Camera not active</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click &quot;Start Scanning&quot; to begin
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 p-3">
            <Spinner size="sm" className="text-blue-600" />
            <p className="text-sm text-blue-700">Processing QR code...</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanner}
              disabled={isProcessing || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Initializing...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanning
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={stopScanner}
              variant="outline"
              disabled={isProcessing}
              className="flex-1"
            >
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Scanning
            </Button>
          )}
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isProcessing}
            >
              Close
            </Button>
          )}
        </div>

        {/* Camera Permissions Help */}
        {error && error.includes('permission') && (
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-medium">Camera permissions required:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Check your browser settings to allow camera access</li>
              <li>On mobile, check app permissions in system settings</li>
              <li>Reload the page after granting permissions</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
