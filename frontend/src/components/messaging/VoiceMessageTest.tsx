"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageBubble } from "./MessageBubble"

// Mock message data for testing
const mockVoiceMessage = {
  id: 1,
  text: "", // Empty text for voice message
  attachment_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
  attachment: undefined,
  timestamp: new Date().toISOString(),
  sender: {
    id: 1,
    name: "John Doe",
    is_provider: false,
    avatar: ""
  },
  is_read: false,
  attachments: []
}

const mockReceivedVoiceMessage = {
  id: 2, 
  text: "",
  attachment_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
  attachment: undefined,
  timestamp: new Date().toISOString(),
  sender: {
    id: 2,
    name: "Jane Smith",
    is_provider: true,
    avatar: ""
  },
  is_read: false,
  attachments: []
}

const mockTextMessage = {
  id: 3,
  text: "This is a regular text message with an image attachment",
  attachment_url: "https://via.placeholder.com/300x200.jpg",
  attachment: undefined,
  timestamp: new Date().toISOString(),
  sender: {
    id: 1,
    name: "John Doe",
    is_provider: false,
    avatar: ""
  },
  is_read: false,
  attachments: []
}

export function VoiceMessageTest() {
  const [showDemo, setShowDemo] = useState(true)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Voice Message Display Test</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Testing the improved voice message display in chat bubbles
        </p>
        
        <Button 
          onClick={() => setShowDemo(!showDemo)}
          className="mb-6"
        >
          {showDemo ? 'Hide Demo' : 'Show Demo'}
        </Button>
      </Card>

      {showDemo && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Voice Messages</h3>
            <div className="space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              
              {/* Own voice message */}
              <MessageBubble
                message={mockVoiceMessage}
                currentUserId={1}
                onDelete={() => console.log("Delete voice message")}
                onReply={() => console.log("Reply to voice message")}
              />

              {/* Received voice message */}
              <MessageBubble
                message={mockReceivedVoiceMessage}
                currentUserId={1}
                onDelete={() => console.log("Delete voice message")}
                onReply={() => console.log("Reply to voice message")}
              />
              
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Text Message with Image (for comparison)</h3>
            <div className="space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              
              {/* Regular message with image */}
              <MessageBubble
                message={mockTextMessage}
                currentUserId={1}
                onDelete={() => console.log("Delete message")}
                onReply={() => console.log("Reply to message")}
              />
              
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Voice messages should display only the VoiceMessagePlayer component</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>No "Voice message" text or photo placeholder should appear</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Voice messages should have transparent background (VoiceMessagePlayer handles styling)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Regular messages with images should still work normally</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}