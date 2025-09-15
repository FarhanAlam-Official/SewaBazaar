/**
 * VoucherQRScanner Component
 * 
 * Advanced QR code scanning interface for voucher redemption
 * Features:
 * - Live camera scanning with viewfinder
 * - File upload scanning for QR images
 * - Manual code entry as fallback
 * - Flash/torch control
 * - Multiple camera support
 * - Scan result validation
 * - Error handling and user feedback
 * - Mobile-optimized scanning experience
 * 
 * @component
 * @example
 * <VoucherQRScanner 
 *   onScanSuccess={handleVoucherCode}
 *   onClose={closeScannerModal}
 *   isOpen={showScanner}
 * />
 */

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Camera, 
  Upload, 
  Type, 
  CheckCircle,
  XCircle,
  RotateCcw,
  Flashlight,
  FlashlightOff,
  Scan,
  Gift,
  AlertCircle
} from "lucide-react"

interface VoucherQRScannerProps {
  onVoucherScanned: (voucherCode: string) => void
  onClose: () => void
  isOpen: boolean
}

interface ScannedVoucher {
  code: string
  value: number
  status: 'valid' | 'invalid' | 'expired' | 'used'
  expiryDate?: string
}

export function VoucherQRScanner({ 
  onVoucherScanned, 
  onClose, 
  isOpen 
}: VoucherQRScannerProps) {
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'manual'>('camera')
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [scannedVoucher, setScannedVoucher] = useState<ScannedVoucher | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasFlash, setHasFlash] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      initializeCamera()
    }
    
    return () => {
      stopCamera()
    }
  }, [isOpen, scanMode])

  const initializeCamera = async () => {
    try {
      setError(null)
      setCameraPermission('pending')
      
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Check for flash support
      const tracks = stream.getVideoTracks()
      if (tracks.length > 0) {
        const capabilities = tracks[0].getCapabilities()
        setHasFlash('torch' in capabilities)
      }

      setCameraPermission('granted')
      startScanning()
    } catch (err) {
      console.error('Camera access error:', err)
      setCameraPermission('denied')
      setError('Unable to access camera. Please check permissions or try manual entry.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    setIsScanning(false)
  }

  const startScanning = () => {
    setIsScanning(true)
    
    // Simulate QR scanning (in real app, use a QR library like qr-scanner)
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        // In real implementation, capture frame and scan for QR codes
        // For demo, we'll simulate finding a QR code occasionally
        if (Math.random() < 0.1) { // 10% chance per scan
          handleQRCodeDetected('DEMO-VOUCHER-' + Math.random().toString(36).substr(2, 9).toUpperCase())
        }
      }
    }, 1000)
  }

  const handleQRCodeDetected = async (qrCode: string) => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setIsScanning(false)
    await validateVoucher(qrCode)
  }

  const validateVoucher = async (code: string) => {
    try {
      // In real app, this would be an API call
      // const response = await fetch(`/api/vouchers/validate/${code}`)
      // const voucher = await response.json()
      
      // Mock validation
      const mockVoucher: ScannedVoucher = {
        code: code,
        value: Math.floor(Math.random() * 1000) + 100,
        status: Math.random() > 0.8 ? 'expired' : 'valid',
        expiryDate: '2024-12-31'
      }
      
      setScannedVoucher(mockVoucher)
    } catch (err) {
      setError('Failed to validate voucher code')
    }
  }

  const toggleFlash = async () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getVideoTracks()
      if (tracks.length > 0) {
        try {
          // Note: Flash control is limited on most browsers/devices
          await tracks[0].applyConstraints({
            advanced: [{ torch: !flashEnabled } as any]
          })
          setFlashEnabled(!flashEnabled)
        } catch (err) {
          console.error('Flash toggle error:', err)
        }
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In real app, process the uploaded image to extract QR code
      // For demo, simulate finding a QR code
      const mockCode = 'UPLOAD-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      validateVoucher(mockCode)
    }
  }

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      validateVoucher(manualCode.trim().toUpperCase())
    }
  }

  const handleConfirmVoucher = () => {
    if (scannedVoucher && scannedVoucher.status === 'valid') {
      onVoucherScanned(scannedVoucher.code)
      onClose()
    }
  }

  const resetScanner = () => {
    setScannedVoucher(null)
    setError(null)
    setManualCode('')
    if (scanMode === 'camera') {
      startScanning()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Scan className="w-5 h-5" />
            <span>Scan Voucher QR Code</span>
          </DialogTitle>
        </DialogHeader>

        {scannedVoucher ? (
          // Scanned voucher result
          <div className="space-y-4">
            <Card className={`${
              scannedVoucher.status === 'valid' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {scannedVoucher.status === 'valid' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>
                    {scannedVoucher.status === 'valid' ? 'Valid Voucher' : 'Invalid Voucher'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Voucher Code</Label>
                  <p className="font-mono text-lg">{scannedVoucher.code}</p>
                </div>
                
                {scannedVoucher.status === 'valid' && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Value</Label>
                      <p className="text-2xl font-bold text-green-600">₹{scannedVoucher.value}</p>
                    </div>
                    
                    {scannedVoucher.expiryDate && (
                      <div>
                        <Label className="text-sm font-medium">Valid Until</Label>
                        <p>{new Date(scannedVoucher.expiryDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </>
                )}

                {scannedVoucher.status !== 'valid' && (
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      {scannedVoucher.status === 'expired' && 'This voucher has expired'}
                      {scannedVoucher.status === 'used' && 'This voucher has already been used'}
                      {scannedVoucher.status === 'invalid' && 'This voucher code is not valid'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={resetScanner}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Scan Another
              </Button>
              
              {scannedVoucher.status === 'valid' && (
                <Button 
                  onClick={handleConfirmVoucher}
                  className="flex-1"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Use Voucher
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Scanner interface
          <div className="space-y-4">
            {/* Scan Mode Selector */}
            <div className="flex space-x-2">
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('camera')}
                disabled={cameraPermission === 'denied'}
              >
                <Camera className="w-4 h-4 mr-1" />
                Camera
              </Button>
              <Button
                variant={scanMode === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('upload')}
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('manual')}
              >
                <Type className="w-4 h-4 mr-1" />
                Manual
              </Button>
            </div>

            {error && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Camera Scanner */}
            {scanMode === 'camera' && (
              <div className="space-y-3">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {isScanning ? 'Scanning...' : 'Position QR code here'}
                      </span>
                    </div>
                  </div>

                  {/* Flash toggle */}
                  {hasFlash && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-white hover:bg-white/20"
                      onClick={toggleFlash}
                    >
                      {flashEnabled ? (
                        <FlashlightOff className="w-4 h-4" />
                      ) : (
                        <Flashlight className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>

                {cameraPermission === 'denied' && (
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Camera access denied. Please enable camera permissions or use manual entry.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* File Upload */}
            {scanMode === 'upload' && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">
                    Upload an image containing a QR code
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="max-w-xs mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Manual Entry */}
            {scanMode === 'manual' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="manual-code">Enter Voucher Code</Label>
                  <Input
                    id="manual-code"
                    placeholder="Enter voucher code (e.g., ABC123XYZ)"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
                <Button 
                  onClick={handleManualSubmit}
                  disabled={!manualCode.trim()}
                  className="w-full"
                >
                  Validate Code
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}