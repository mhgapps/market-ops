'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Download, Printer, Copy, CheckCircle } from 'lucide-react'

interface QRCodeDisplayProps {
  qrCode: string
  assetName: string
  assetId?: string
  size?: number
}

export function QRCodeDisplay({
  qrCode,
  assetName,
  assetId,
  size = 256,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current) return

      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        const qrUrl = `${appUrl}/qr/${encodeURIComponent(qrCode)}`

        await QRCode.toCanvas(canvasRef.current, qrUrl, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setError(null)
      } catch (err) {
        console.error('Error generating QR code:', err)
        setError('Failed to generate QR code')
      }
    }

    generateQRCode()
  }, [qrCode, size])

  const handleDownload = async () => {
    if (!canvasRef.current) return

    try {
      const url = canvasRef.current.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `asset-${qrCode}.png`
      link.href = url
      link.click()
    } catch (err) {
      console.error('Error downloading QR code:', err)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !canvasRef.current) return

    const imageUrl = canvasRef.current.toDataURL('image/png')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${qrCode}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
            }
            img {
              max-width: 100%;
              height: auto;
              border: 2px solid #333;
              margin: 20px 0;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            .qr-code {
              font-size: 18px;
              font-weight: bold;
              margin: 10px 0;
            }
            .asset-id {
              font-size: 14px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${assetName}</h1>
            <div class="qr-code">QR Code: ${qrCode}</div>
            ${assetId ? `<div class="asset-id">Asset ID: ${assetId}</div>` : ''}
            <img src="${imageUrl}" alt="QR Code for ${qrCode}" />
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col items-center justify-center space-y-3">
        {error ? (
          <div className="flex items-center justify-center w-64 h-64 border-2 border-destructive/30 rounded-lg bg-destructive/5">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-background">
            <canvas ref={canvasRef} />
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          <code className="text-lg font-mono font-bold">{qrCode}</code>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="min-h-[44px] min-w-[44px] p-0"
            aria-label={copied ? 'Copied' : 'Copy QR code'}
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="w-full min-h-[44px]"
          disabled={!!error}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="w-full min-h-[44px]"
          disabled={!!error}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  )
}
