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
// Removed framer-motion for better performance
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

  // Download comprehensive voucher image
  const handleDownload = useCallback(async () => {
    if (!voucher) return;

    try {
      // Create a canvas to generate a comprehensive voucher image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }

      // Set canvas dimensions
      canvas.width = 400;
      canvas.height = 600;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw border
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      ctx.setLineDash([]);

      // Draw logo
      ctx.fillStyle = '#333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SewaBazaar', canvas.width / 2, 60);

      // Draw title
      ctx.fillStyle = '#000';
      ctx.font = '20px Arial';
      ctx.fillText('Discount Voucher', canvas.width / 2, 100);

      // Draw QR code (if available)
      if (qrCodeUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = qrCodeUrl;
          
          // Wait for image to load
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          // Draw QR code
          const qrSize = 200;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 130;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        } catch (qrError) {
          console.warn('Could not load QR code for sharing:', qrError);
        }
      }

      // Draw voucher code
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(50, 350, canvas.width - 100, 40);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(voucher.voucher_code, canvas.width / 2, 375);

      // Draw value
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Value: Rs. ${voucher.value}`, canvas.width / 2, 420);

      // Draw expiry
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.fillText(`Expires: ${new Date(voucher.expires_at).toLocaleDateString()}`, canvas.width / 2, 450);

      // Draw status
      const statusConfig = {
        active: { color: '#10b981', label: 'Active' },
        used: { color: '#6b7280', label: 'Used' },
        expired: { color: '#ef4444', label: 'Expired' },
        cancelled: { color: '#f97316', label: 'Cancelled' }
      };
      
      const status = statusConfig[voucher.status] || statusConfig.active;
      ctx.fillStyle = status.color;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Status: ${status.label}`, canvas.width / 2, 480);

      // Draw footer
      ctx.fillStyle = '#999';
      ctx.font = '12px Arial';
      ctx.fillText('Scan QR code or enter code during checkout', canvas.width / 2, 530);
      ctx.fillText('Visit sewabazaar.com for terms and conditions', canvas.width / 2, 550);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `sewabazaar_voucher_${voucher.voucher_code}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showToast.success({ title: 'Voucher image downloaded!' });
        } else {
          throw new Error('Could not create image blob');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading voucher image:', error);
      showToast.error({ title: 'Failed to download voucher image' });
    }
  }, [voucher, qrCodeUrl]);

  // Share QR code
  const handleShare = useCallback(async () => {
    if (!voucher) return;

    try {
      // Create a canvas to generate a comprehensive voucher image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }

      // Set canvas dimensions
      canvas.width = 400;
      canvas.height = 600;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw border
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      ctx.setLineDash([]);

      // Draw logo
      ctx.fillStyle = '#333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SewaBazaar', canvas.width / 2, 60);

      // Draw title
      ctx.fillStyle = '#000';
      ctx.font = '20px Arial';
      ctx.fillText('Discount Voucher', canvas.width / 2, 100);

      // Draw QR code (if available)
      if (qrCodeUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = qrCodeUrl;
          
          // Wait for image to load
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          // Draw QR code
          const qrSize = 200;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 130;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        } catch (qrError) {
          console.warn('Could not load QR code for sharing:', qrError);
        }
      }

      // Draw voucher code
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(50, 350, canvas.width - 100, 40);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(voucher.voucher_code, canvas.width / 2, 375);

      // Draw value
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Value: Rs. ${voucher.value}`, canvas.width / 2, 420);

      // Draw expiry
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.fillText(`Expires: ${new Date(voucher.expires_at).toLocaleDateString()}`, canvas.width / 2, 450);

      // Draw status
      const statusConfig = {
        active: { color: '#10b981', label: 'Active' },
        used: { color: '#6b7280', label: 'Used' },
        expired: { color: '#ef4444', label: 'Expired' },
        cancelled: { color: '#f97316', label: 'Cancelled' }
      };
      
      const status = statusConfig[voucher.status] || statusConfig.active;
      ctx.fillStyle = status.color;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Status: ${status.label}`, canvas.width / 2, 480);

      // Draw footer
      ctx.fillStyle = '#999';
      ctx.font = '12px Arial';
      ctx.fillText('Scan QR code or enter code during checkout', canvas.width / 2, 530);
      ctx.fillText('Visit sewabazaar.com for terms and conditions', canvas.width / 2, 550);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create image blob'));
          }
        }, 'image/png');
      });

      const file = new File([blob], `voucher_${voucher.voucher_code}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: 'SewaBazaar Voucher',
          text: `Check out this voucher! Code: ${voucher.voucher_code} - Value: Rs. ${voucher.value}`,
          files: [file]
        });
      } else {
        // Fallback: copy voucher code
        await navigator.clipboard.writeText(voucher.voucher_code);
        showToast.success({ title: 'Voucher code copied to clipboard!' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      showToast.error({ title: 'Failed to share voucher' });
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
    active: { 
      color: 'bg-green-500', 
      textColor: 'text-green-700 dark:text-green-300', 
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      label: 'Active' 
    },
    used: { 
      color: 'bg-gray-500', 
      textColor: 'text-gray-700 dark:text-gray-300', 
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      label: 'Used' 
    },
    expired: { 
      color: 'bg-red-500', 
      textColor: 'text-red-700 dark:text-red-300', 
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      label: 'Expired' 
    },
    cancelled: { 
      color: 'bg-orange-500', 
      textColor: 'text-orange-700 dark:text-orange-300', 
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      label: 'Cancelled' 
    }
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
            <div className="flex items-center justify-center space-x-3">
              <Badge 
                variant={
                  voucher.status === 'active' ? 'success' :
                  voucher.status === 'used' ? 'secondary' :
                  voucher.status === 'expired' ? 'destructive' :
                  'warning'
                }
                className="px-3 py-1.5 text-sm font-bold shadow-sm"
              >
                {config.label}
              </Badge>
              <Badge 
                variant="outline" 
                className="px-3 py-1.5 text-sm font-bold border-2 bg-white dark:bg-card text-primary dark:text-primary border-primary/30"
              >
                Rs. {voucher.value}
              </Badge>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Voucher Code</h3>
              <div className="flex items-center justify-center space-x-2">
                <code className="bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-lg text-base font-mono border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-sm">
                  {voucher.voucher_code}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="h-10 w-10 p-0 border-2 border-gray-300 dark:border-gray-600 hover:bg-primary/10 dark:hover:bg-primary/20"
                >
                  <Copy className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </Button>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div
              className="relative"
            >
              {isGenerating ? (
                <div className="w-[300px] h-[300px] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="bg-white dark:bg-card p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                  <img
                    src={qrCodeUrl}
                    alt="Voucher QR Code"
                    className="w-full h-auto max-w-[260px] rounded-lg"
                    onError={() => showToast.error({ title: 'Failed to load QR code' })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Voucher Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-card/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Value</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Rs. {voucher.value}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-card/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Expires</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{new Date(voucher.expires_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={handleDownload}
              disabled={!qrCodeUrl || isGenerating}
              className="py-2.5 font-medium shadow-sm hover:shadow-md transition-shadow bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              disabled={!qrCodeUrl || isGenerating}
              variant="outline"
              className="py-2.5 font-medium border-2 border-gray-300 hover:border-primary hover:bg-primary/5 hover:shadow-sm transition-all text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              size="sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handlePrint}
              disabled={!qrCodeUrl || isGenerating}
              variant="outline"
              className="py-2.5 font-medium border-2 border-gray-300 hover:border-primary hover:bg-primary/5 hover:shadow-sm transition-all text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              size="sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center py-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
            <p className="text-sm font-medium text-primary dark:text-primary-foreground">Scan this QR code during checkout</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}