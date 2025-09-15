/**
 * VoucherSharing Component
 * 
 * Comprehensive voucher sharing interface with multiple sharing methods
 * Features:
 * - Email sharing with custom messages
 * - Social media sharing (WhatsApp, Facebook, Twitter)
 * - QR code sharing for in-person transfers
 * - Link sharing with copy functionality
 * - Bulk sharing for multiple vouchers
 * - Templates for common sharing scenarios
 * - Share history and tracking
 * 
 * @component
 * @example
 * <VoucherSharing 
 *   voucher={selectedVoucher}
 *   open={isShareModalOpen}
 *   onClose={handleCloseShare}
 * />
 */

import { useState } from "react"
import { VoucherData } from "./VoucherCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { 
  Share2, 
  Mail, 
  MessageSquare, 
  Link, 
  Gift,
  Copy,
  Check,
  ExternalLink,
  Users,
  Heart,
  Calendar,
  Tag
} from "lucide-react"

interface VoucherSharingProps {
  voucher: VoucherData
  isOpen: boolean
  onClose: () => void
  onShare: (method: string, data: any) => void
}

interface ShareContact {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
}

export function VoucherSharing({ 
  voucher, 
  isOpen, 
  onClose, 
  onShare 
}: VoucherSharingProps) {
  const [shareMethod, setShareMethod] = useState<'email' | 'message' | 'link' | 'gift'>('email')
  
  // For simplified system, always use full voucher value
  const voucherValue = voucher.status === 'used' ? 0 : voucher.value
  
  const [emailData, setEmailData] = useState({
    recipients: '',
    subject: `Gift Voucher from SewaBazaar - Rs. ${voucherValue}`,
    message: `Hi! I'm sharing a voucher with you from SewaBazaar. Use code ${voucher.voucher_code} to get Rs. ${voucherValue} off your next service booking.`
  })
  const [giftData, setGiftData] = useState({
    recipientName: '',
    recipientEmail: '',
    message: '',
    scheduledDate: '',
    occasion: ''
  })
  const [messageData, setMessageData] = useState({
    platform: 'whatsapp',
    message: `🎁 Gift Voucher from SewaBazaar!\n\nUse code: ${voucher.voucher_code}\nValue: Rs. ${voucherValue}\nValid until: ${new Date(voucher.expires_at).toLocaleDateString()}\n\nBook your service now: https://sewabazaar.com`
  })
  const [linkCopied, setLinkCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Mock recent contacts
  const recentContacts: ShareContact[] = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@example.com' },
    { id: '2', name: 'Mike Chen', email: 'mike.chen@example.com' },
    { id: '3', name: 'Priya Sharma', email: 'priya.sharma@example.com' },
    { id: '4', name: 'David Wilson', email: 'david.w@example.com' }
  ]

  const shareLink = `https://sewabazaar.com/vouchers/redeem?code=${voucher.voucher_code}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleEmailShare = async () => {
    setIsLoading(true)
    try {
      // In real app, this would send emails via API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      onShare('email', {
        recipients: emailData.recipients.split(',').map(email => email.trim()),
        subject: emailData.subject,
        message: emailData.message,
        voucherCode: voucher.voucher_code
      })
      
      onClose()
    } catch (err) {
      console.error('Email share failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGiftVoucher = async () => {
    setIsLoading(true)
    try {
      // In real app, this would create a gift transfer
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onShare('gift', {
        ...giftData,
        voucherCode: voucher.voucher_code,
        originalValue: voucherValue
      })
      
      onClose()
    } catch (err) {
      console.error('Gift creation failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialShare = (platform: string) => {
    const text = encodeURIComponent(messageData.message)
    const url = encodeURIComponent(shareLink)
    
    let shareUrl = ''
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${text}`
        break
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  const addContactToEmail = (contact: ShareContact) => {
    const currentRecipients = emailData.recipients
    const newEmail = contact.email || ''
    
    if (newEmail && !currentRecipients.includes(newEmail)) {
      const newRecipients = currentRecipients 
        ? `${currentRecipients}, ${newEmail}`
        : newEmail
      
      setEmailData({ ...emailData, recipients: newRecipients })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share Voucher</span>
          </DialogTitle>
        </DialogHeader>

        {/* Voucher Preview */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-lg font-bold text-blue-800">
                  {voucher.voucher_code}
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  Rs. {voucherValue}
                </div>
                <div className="text-sm text-gray-600">
                  Valid until {new Date(voucher.expires_at).toLocaleDateString()}
                </div>
              </div>
              <Gift className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Tabs value={shareMethod} onValueChange={(value) => setShareMethod(value as any)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="email" className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </TabsTrigger>
            <TabsTrigger value="message" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Message</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center space-x-2">
              <Link className="w-4 h-4" />
              <span>Link</span>
            </TabsTrigger>
            <TabsTrigger value="gift" className="flex items-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>Gift</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipients">Recipients</Label>
                <Input
                  id="recipients"
                  placeholder="Enter email addresses separated by commas"
                  value={emailData.recipients}
                  onChange={(e) => setEmailData({ ...emailData, recipients: e.target.value })}
                />
              </div>

              {/* Quick Add Contacts */}
              <div>
                <Label className="text-sm font-medium">Quick Add</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {recentContacts.map((contact) => (
                    <Button
                      key={contact.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addContactToEmail(contact)}
                      className="text-xs"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      {contact.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={4}
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                />
              </div>

              <Button 
                onClick={handleEmailShare}
                disabled={!emailData.recipients.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="message" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare },
                    { id: 'telegram', name: 'Telegram', icon: MessageSquare },
                    { id: 'twitter', name: 'Twitter', icon: MessageSquare },
                    { id: 'facebook', name: 'Facebook', icon: MessageSquare }
                  ].map((platform) => (
                    <Button
                      key={platform.id}
                      variant={messageData.platform === platform.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMessageData({ ...messageData, platform: platform.id })}
                    >
                      <platform.icon className="w-4 h-4 mr-2" />
                      {platform.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="share-message">Message</Label>
                <Textarea
                  id="share-message"
                  rows={6}
                  value={messageData.message}
                  onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                />
              </div>

              <Button 
                onClick={() => handleSocialShare(messageData.platform)}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Share on {messageData.platform}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <Link className="w-4 h-4" />
                <AlertDescription>
                  Share this link with anyone to let them redeem the voucher
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="px-3"
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {linkCopied && (
                <Alert className="border-green-200 bg-green-50">
                  <Check className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Link copied to clipboard!
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleSocialShare('whatsapp')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleSocialShare('telegram')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Telegram
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleSocialShare('twitter')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleSocialShare('facebook')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gift" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <Gift className="w-4 h-4" />
                <AlertDescription>
                  Transfer this voucher as a gift to someone special
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient-name">Recipient Name</Label>
                  <Input
                    id="recipient-name"
                    placeholder="Enter recipient's name"
                    value={giftData.recipientName}
                    onChange={(e) => setGiftData({ ...giftData, recipientName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="recipient-email">Recipient Email</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="Enter recipient's email"
                    value={giftData.recipientEmail}
                    onChange={(e) => setGiftData({ ...giftData, recipientEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occasion">Occasion (Optional)</Label>
                  <Input
                    id="occasion"
                    placeholder="e.g., Birthday, Anniversary"
                    value={giftData.occasion}
                    onChange={(e) => setGiftData({ ...giftData, occasion: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled-date">Send Date (Optional)</Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={giftData.scheduledDate}
                    onChange={(e) => setGiftData({ ...giftData, scheduledDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gift-message">Personal Message</Label>
                <Textarea
                  id="gift-message"
                  rows={3}
                  placeholder="Add a personal message for the recipient"
                  value={giftData.message}
                  onChange={(e) => setGiftData({ ...giftData, message: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                <Heart className="w-5 h-5 text-purple-600" />
                <div className="text-sm">
                  <div className="font-medium text-purple-800">Gift Details</div>
                  <div className="text-purple-600">
                    Voucher worth Rs. {voucherValue} • Valid until {new Date(voucher.expires_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGiftVoucher}
                disabled={!giftData.recipientName.trim() || !giftData.recipientEmail.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating Gift...' : 'Send as Gift'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}