"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { messagingApi } from "./api"
import { ConfirmContinueChatModal } from "./ConfirmContinueChatModal"
import { motion } from "framer-motion"

interface QuickContactModalProps {
  open: boolean
  onClose: () => void
  serviceId: number
  providerId: number
  providerName: string
  serviceName?: string
}

export function QuickContactModal({
  open,
  onClose,
  serviceId,
  providerId,
  providerName,
  serviceName = "this service"
}: QuickContactModalProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [createdConversationId, setCreatedConversationId] = useState<number | null>(null)

  // Quick message templates
  const templates = [
    `Hi, I'm interested in ${serviceName}. Could you provide more details?`,
    "What's your availability for this service?",
    "Can you provide a custom quote for my requirements?",
    "I'd like to discuss the service details before booking.",
  ]

  const handleSendMessage = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    try {
      // Use messaging API to create conversation
      const data = await messagingApi.createConversation({
        service_id: serviceId,
        provider_id: providerId,
        initial_message: message.trim()
      })

      // Store conversation ID for the confirmation modal
      setCreatedConversationId(data.id)
      
      // Close this modal and show confirmation modal
      onClose()
      setMessage("")
      setShowConfirmModal(true)

    } catch (error: any) {
      console.error('Message send error:', error)
      showToast.error({
        title: "Failed to Send Message",
        description: error.message || "Please check your connection and try again later",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueChat = () => {
    if (createdConversationId) {
      window.location.href = `/dashboard/customer/messages/${createdConversationId}`
    }
  }

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false)
    setCreatedConversationId(null)
    
    // Show success toast after closing confirmation modal
    showToast.success({
      title: "Message Sent! ✨",
      description: `Your message has been delivered to ${providerName}`,
    })
  }

  const handleTemplateClick = (template: string) => {
    setMessage(template)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="text-center pb-6">
            <motion.div
              className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mb-4"
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <MessageSquare className="h-8 w-8 text-primary" />
            </motion.div>
            <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-3">
              Contact {providerName}
            </DialogTitle>
            <p className="text-muted-foreground mt-2">
              Send a quick message to start your conversation
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick templates */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Label className="text-base font-semibold mb-3 block">Quick Messages:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((template, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 p-3 text-sm font-medium w-full justify-start border-2 hover:border-primary/50 hover:shadow-md"
                      onClick={() => handleTemplateClick(template)}
                    >
                      {template.substring(0, 40)}...
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Message textarea */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="message" className="text-base font-semibold">Your Message:</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value.substring(0, 500))}
                placeholder="Type your message here..."
                maxLength={500}
                rows={5}
                className="mt-3 border-2 border-muted/50 focus:border-primary/60 transition-all duration-300 bg-background/70 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-primary/10 text-base font-medium"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-muted-foreground">
                  {message.length}/500 characters
                </p>
                <div className="w-20 bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(message.length / 500) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div 
              className="flex justify-between gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    // Redirect to full chat page with pre-filled message
                    const chatUrl = `/dashboard/customer/messages/new?service=${serviceId}&provider=${providerId}&message=${encodeURIComponent(
                      message
                    )}`
                    window.location.href = chatUrl
                  }}
                  className="px-6 py-3 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                >
                  Open Full Chat
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="min-w-[120px] px-6 py-3 bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all duration-200"
                >
                  {isLoading ? (
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </motion.div>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>

      {/* Beautiful Confirmation Modal */}
      <ConfirmContinueChatModal
        open={showConfirmModal}
        onClose={handleCloseConfirmModal}
        onConfirm={handleContinueChat}
        providerName={providerName}
        conversationId={createdConversationId || 0}
      />
    </Dialog>
  )
}