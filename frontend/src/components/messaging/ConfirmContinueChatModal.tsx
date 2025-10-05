"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowRight, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ConfirmContinueChatModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  providerName: string
  conversationId: number
}

export function ConfirmContinueChatModal({
  open,
  onClose,
  onConfirm,
  providerName,
  conversationId
}: ConfirmContinueChatModalProps) {
  const [isNavigating, setIsNavigating] = useState(false)

  const handleConfirm = async () => {
    setIsNavigating(true)
    onConfirm()
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[400px] overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <DialogTitle className="text-xl font-semibold">
                  Message Sent Successfully! 🎉
                </DialogTitle>
                <DialogDescription className="text-base">
                  Your message has been delivered to <strong>{providerName}</strong>. 
                  Would you like to continue the conversation?
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleConfirm}
                  disabled={isNavigating}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium"
                >
                  {isNavigating ? (
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Opening Chat...
                    </motion.div>
                  ) : (
                    <>
                      Continue Conversation
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isNavigating}
                  className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Stay Here
                </Button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                  💡 You can always access your conversations from the Messages section in your dashboard
                </p>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}