/**
 * VoucherQRModal Component
 * 
 * Modal for displaying voucher QR codes with sharing and download functionality
 * Features:
 * - Full-size QR code display
 * - Download QR code as image
 * - Share functionality
 * - Mobile-responsive
 * - Print-friendly
 */

import { useState, useCallback, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { VoucherData } from "./VoucherCard"
import { 
  Download, 
  Share2, 
  Copy, 
  Printer, 
  X, 
  QrCode,
  Calendar,
  DollarSign,
  Clock
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface VoucherQRModalProps {
  voucher: VoucherData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VoucherQRModal({ voucher, open, onOpenChange }: VoucherQRModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate QR code when modal opens
  const generateQRCode = useCallback(async () => {
    if (!voucher) return

    setIsGenerating(true)
    try {
      const qrData = voucher.qr_code_data || JSON.stringify({
        type: 'voucher',
        code: voucher.voucher_code,
        value: voucher.value,
        expires: voucher.expires_at
      })

      // Create a simple QR code using an online service for demo
      // In production, you'd want to use a proper QR library
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      showToast.error({ title: 'Failed to generate QR code' })
    } finally {
      setIsGenerating(false)
    }
  }, [voucher])

  // Generate QR code when voucher changes
  useEffect(() => {
    if (voucher && open) {
      generateQRCode()
    }
  }, [voucher, open, generateQRCode])

  // Download QR code
  const handleDownload = useCallback(() => {
    if (!qrCodeUrl || !voucher) return

    const link = document.createElement('a')
    link.download = `sewabazaar_voucher_${voucher.voucher_code}.png`
    link.href = qrCodeUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast.success({ title: 'QR code downloaded!' })
  }, [qrCodeUrl, voucher])

  // Share QR code
  const handleShare = useCallback(async () => {
    if (!voucher) return

    try {
      if (navigator.share && qrCodeUrl) {
        // Convert data URL to blob for sharing
        const response = await fetch(qrCodeUrl)
        const blob = await response.blob()
        const file = new File([blob], `voucher_${voucher.voucher_code}.png`, { type: 'image/png' })
        
        await navigator.share({
          title: 'SewaBazaar Voucher',
          text: `Voucher Code: ${voucher.voucher_code} - Rs. ${voucher.value}`,
          files: [file]
        })
      } else {
        // Fallback: copy voucher code
        await navigator.clipboard.writeText(voucher.voucher_code)
        showToast.success({ title: 'Voucher code copied to clipboard!' })
      }
    } catch (error) {
      console.error('Error sharing:', error)
      showToast.error({ title: 'Failed to share voucher' })
    }
  }, [voucher, qrCodeUrl])

  // Copy voucher code
  const handleCopyCode = useCallback(async () => {
    if (!voucher) return

    try {
      await navigator.clipboard.writeText(voucher.voucher_code)
      showToast.success({ title: 'Voucher code copied!' })
    } catch (error) {
      showToast.error({ title: 'Failed to copy voucher code' })
    }
  }, [voucher])

  // Print QR code
  const handlePrint = useCallback(() => {
    if (!voucher || !qrCodeUrl) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>SewaBazaar Voucher - ${voucher.voucher_code}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                text-align: center;
              }
              .voucher-container {
                max-width: 400px;
                margin: 0 auto;
                border: 2px dashed #ddd;
                padding: 30px;
                border-radius: 10px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 20px;
              }
              .qr-code {
                margin: 20px 0;
              }
              .voucher-code {
                font-family: monospace;
                font-size: 18px;
                font-weight: bold;
                background: #f5f5f5;
                padding: 10px;
                border-radius: 5px;
                margin: 15px 0;
              }
              .voucher-value {
                font-size: 20px;
                color: #2563eb;
                font-weight: bold;
                margin: 10px 0;
              }
              .expiry {
                font-size: 14px;
                color: #666;
                margin: 10px 0;
              }
              .footer {
                font-size: 12px;
                color: #999;
                margin-top: 30px;
                border-top: 1px solid #eee;
                padding-top: 15px;
              }
            </style>
          </head>
          <body>
            <div class="voucher-container">
              <div class="logo">SewaBazaar</div>
              <h2>Discount Voucher</h2>
              <div class="qr-code">
                <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 200px; height: auto;" />
              </div>
              <div class="voucher-code">Code: ${voucher.voucher_code}</div>
              <div class="voucher-value">Value: Rs. ${voucher.value}</div>
              <div class="expiry">Expires: ${new Date(voucher.expires_at).toLocaleDateString()}</div>
              <div class="footer">
                <p>Scan QR code or enter code during checkout</p>
                <p>Visit sewabazaar.com for terms and conditions</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }, [voucher, qrCodeUrl])

  if (!voucher) return null

  const statusConfig = {
    active: { color: 'bg-green-500', textColor: 'text-green-700', label: 'Active' },
    used: { color: 'bg-gray-500', textColor: 'text-gray-700', label: 'Used' },
    expired: { color: 'bg-red-500', textColor: 'text-red-700', label: 'Expired' },
    cancelled: { color: 'bg-orange-500', textColor: 'text-orange-700', label: 'Cancelled' }
  }

  const config = statusConfig[voucher.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>Voucher QR Code</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Voucher Info */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary" className={config.textColor}>
                {config.label}
              </Badge>
              <Badge variant="outline">
                Rs. {voucher.value}
              </Badge>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Voucher Code</h3>
              <div className="flex items-center justify-center space-x-2">
                <code className="bg-gray-100 px-3 py-2 rounded-md text-sm font-mono border">
                  {voucher.voucher_code}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyCode}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {isGenerating ? (
                <div className="w-[300px] h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img
                    src={qrCodeUrl}
                    alt="Voucher QR Code"
                    className="w-full h-auto max-w-[300px] rounded"
                    onError={() => showToast.error({ title: 'Failed to load QR code' })}
                  />
                </div>
              )}
            </motion.div>
          </div>

          {/* Voucher Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-600">Value</p>
                <p className="font-medium">Rs. {voucher.value}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-600">Expires</p>
                <p className="font-medium">{new Date(voucher.expires_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleDownload}
              disabled={!qrCodeUrl}
              className="flex-1"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              disabled={!qrCodeUrl}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handlePrint}
              disabled={!qrCodeUrl}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-gray-600 space-y-1">
            <p>Scan this QR code during checkout</p>
            <p>or enter the voucher code manually</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
