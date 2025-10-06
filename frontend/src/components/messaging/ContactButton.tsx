"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Phone, Mail } from "lucide-react"
import { QuickContactModal } from "./QuickContactModal"

interface ContactButtonProps {
  serviceId: number
  providerId: number
  providerName: string
  serviceName?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  showIcon?: boolean
}

export function ContactButton({
  serviceId,
  providerId,
  providerName,
  serviceName,
  variant = "default",
  size = "default",
  className = "",
  showIcon = true
}: ContactButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        {showIcon && <MessageSquare className="mr-2 h-4 w-4" />}
        Contact Provider
      </Button>

      <QuickContactModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceId={serviceId}
        providerId={providerId}
        providerName={providerName}
        serviceName={serviceName}
      />
    </>
  )
}