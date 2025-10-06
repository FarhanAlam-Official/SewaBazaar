"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { VoiceMessagePlayer } from "./VoiceMessagePlayer"
import { VoiceMessageRecorder } from "./VoiceMessageRecorder"
import { Card } from "@/components/ui/card"

export function VoiceMessageDemo() {
  const [showRecorder, setShowRecorder] = useState(false)
  const [voiceMessages, setVoiceMessages] = useState<Array<{
    id: string
    url: string
    duration: number
    timestamp: string
    isOwn: boolean
  }>>([])

  const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    // Create a URL for the blob to simulate a voice message
    const url = URL.createObjectURL(audioBlob)
    
    const newMessage = {
      id: Date.now().toString(),
      url,
      duration,
      timestamp: new Date().toISOString(),
      isOwn: true
    }
    
    setVoiceMessages(prev => [...prev, newMessage])
    setShowRecorder(false)
  }

  const handleError = (error: string) => {
    console.error('Voice message error:', error)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Voice Message Components Demo</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Test the beautifully redesigned voice message recorder and player components.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => setShowRecorder(!showRecorder)}
            className="w-full"
          >
            {showRecorder ? 'Hide Recorder' : 'Show Voice Recorder'}
          </Button>
          
          <VoiceMessageRecorder
            isVisible={showRecorder}
            onSend={handleSendVoiceMessage}
            onCancel={() => setShowRecorder(false)}
            maxDuration={60}
          />
        </div>
      </Card>

      {voiceMessages.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recorded Messages</h3>
          <div className="space-y-4">
            {voiceMessages.map((message) => (
              <div key={message.id} className="flex justify-end">
                <VoiceMessagePlayer
                  audioUrl={message.url}
                  duration={message.duration}
                  isOwn={message.isOwn}
                  timestamp={message.timestamp}
                  onError={handleError}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Demo with sample voice messages */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sample Voice Messages</h3>
        <div className="space-y-4">
          <div className="flex justify-start">
            <VoiceMessagePlayer
              audioUrl="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
              duration={3.2}
              isOwn={false}
              timestamp="2024-01-01T12:00:00Z"
              onError={handleError}
            />
          </div>
          <div className="flex justify-end">
            <VoiceMessagePlayer
              audioUrl="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
              duration={5.7}
              isOwn={true}
              timestamp="2024-01-01T12:01:00Z"
              onError={handleError}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}