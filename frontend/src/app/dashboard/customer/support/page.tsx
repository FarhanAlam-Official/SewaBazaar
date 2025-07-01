"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, PlusCircle, Image as ImageIcon, Send, AlertCircle } from "lucide-react"

// Temporary mock data
const MOCK_TICKETS = [
  {
    id: "1",
    subject: "Booking Cancellation Issue",
    service: "House Cleaning",
    provider: "CleanPro Services",
    status: "open",
    priority: "high",
    createdAt: "2024-03-15",
    lastUpdate: "2024-03-16",
    messages: [
      {
        id: "1",
        sender: "user",
        message: "I need help with cancelling my booking.",
        timestamp: "2024-03-15 14:30"
      },
      {
        id: "2",
        sender: "support",
        message: "Hi! I understand you're having trouble with cancelling your booking. Could you please provide the booking reference number?",
        timestamp: "2024-03-15 14:35"
      }
    ]
  },
  // Add more tickets...
]

export default function SupportPage() {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketDescription, setTicketDescription] = useState("")

  const handleCreateTicket = () => {
    // Handle ticket creation logic
    console.log("Creating ticket:", { ticketSubject, ticketDescription })
    setIsNewTicketOpen(false)
    setTicketSubject("")
    setTicketDescription("")
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    // Handle sending message logic
    console.log("Sending message:", newMessage)
    setNewMessage("")
  }

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Support Tickets</h2>
            <Button onClick={() => setIsNewTicketOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>

          <div className="space-y-4">
            {MOCK_TICKETS.map((ticket) => (
              <Card
                key={ticket.id}
                className={`cursor-pointer hover:bg-accent ${
                  selectedTicket?.id === ticket.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{ticket.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ticket.service} - {ticket.provider}
                        </p>
                      </div>
                      <span className={`text-sm capitalize ${
                        ticket.status === "open" ? "text-green-500" : "text-orange-500"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created: {ticket.createdAt}</span>
                      <span className="capitalize">Priority: {ticket.priority}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedTicket ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedTicket.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTicket.service} - {selectedTicket.provider}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm capitalize ${
                      selectedTicket.status === "open" ? "text-green-500" : "text-orange-500"
                    }`}>
                      {selectedTicket.status}
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Last updated: {selectedTicket.lastUpdate}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  {selectedTicket.messages.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground">
              <div>
                <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Select a ticket to view the conversation</h3>
                <p className="mt-1">Or create a new ticket to get help from our support team</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Enter ticket subject"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your issue..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachments (optional)</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Button variant="outline">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload screenshots or relevant documents
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateTicket}>
              Create Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 