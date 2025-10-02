"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, PlusCircle, Image as ImageIcon, Send, AlertCircle, CheckCircle, Clock, XCircle, User, Calendar, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

// Enhanced mock data with different types of tickets
const MOCK_TICKETS = [
  {
    id: "1",
    subject: "Booking Cancellation Issue",
    service: "House Cleaning",
    provider: "CleanPro Services",
    status: "open",
    priority: "high",
    category: "Booking",
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
  {
    id: "2",
    subject: "Payment Not Processed",
    service: "Plumbing Repair",
    provider: "QuickFix Plumbers",
    status: "resolved",
    priority: "medium",
    category: "Payment",
    createdAt: "2024-03-10",
    lastUpdate: "2024-03-12",
    messages: [
      {
        id: "1",
        sender: "user",
        message: "I made a payment but the service provider says they haven't received it.",
        timestamp: "2024-03-10 09:15"
      },
      {
        id: "2",
        sender: "support",
        message: "Thank you for reporting this. I've checked your payment and it was successfully processed. I've contacted the service provider to resolve this issue.",
        timestamp: "2024-03-10 10:30"
      },
      {
        id: "3",
        sender: "support",
        message: "The issue has been resolved. The service provider has confirmed receipt of your payment.",
        timestamp: "2024-03-12 16:45"
      }
    ]
  },
  {
    id: "3",
    subject: "Service Quality Concern",
    service: "Hair Styling",
    provider: "Glamour Salon",
    status: "in-progress",
    priority: "medium",
    category: "Service",
    createdAt: "2024-03-18",
    lastUpdate: "2024-03-19",
    messages: [
      {
        id: "1",
        sender: "user",
        message: "The service I received was not as described. My hair is damaged after the treatment.",
        timestamp: "2024-03-18 17:20"
      },
      {
        id: "2",
        sender: "support",
        message: "I'm sorry to hear about your experience. I've escalated this to our quality assurance team. We'll contact you within 24 hours.",
        timestamp: "2024-03-18 18:45"
      },
      {
        id: "3",
        sender: "support",
        message: "We've reviewed your case and arranged for a complimentary repair session with a senior stylist.",
        timestamp: "2024-03-19 11:30"
      }
    ]
  },
  {
    id: "4",
    subject: "Refund Request",
    service: "AC Installation",
    provider: "CoolBreeze Services",
    status: "open",
    priority: "high",
    category: "Payment",
    createdAt: "2024-03-20",
    lastUpdate: "2024-03-20",
    messages: [
      {
        id: "1",
        sender: "user",
        message: "I need a refund for a service that was not completed as promised.",
        timestamp: "2024-03-20 13:10"
      }
    ]
  },
  {
    id: "5",
    subject: "Booking Reschedule",
    service: "Car Wash",
    provider: "Sparkle Auto Care",
    status: "resolved",
    priority: "low",
    category: "Booking",
    createdAt: "2024-03-05",
    lastUpdate: "2024-03-06",
    messages: [
      {
        id: "1",
        sender: "user",
        message: "I need to reschedule my booking due to a personal emergency.",
        timestamp: "2024-03-05 08:30"
      },
      {
        id: "2",
        sender: "support",
        message: "No problem. I can help you reschedule your booking. What date would you prefer?",
        timestamp: "2024-03-05 09:15"
      },
      {
        id: "3",
        sender: "user",
        message: "How about next Friday?",
        timestamp: "2024-03-05 10:00"
      },
      {
        id: "4",
        sender: "support",
        message: "Your booking has been successfully rescheduled to next Friday.",
        timestamp: "2024-03-06 14:20"
      }
    ]
  }
]

// Category colors for consistent styling
const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'booking':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    case 'payment':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
    case 'service':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  }
}

// Priority colors for consistent styling
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  }
}

// Status colors for consistent styling
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  }
}

export default function SupportPage() {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketDescription, setTicketDescription] = useState("")
  const [ticketPriority, setTicketPriority] = useState("medium")
  const [ticketCategory, setTicketCategory] = useState("general")

  const handleCreateTicket = () => {
    // Handle ticket creation logic
    console.log("Creating ticket:", { ticketSubject, ticketDescription, ticketPriority, ticketCategory })
    setIsNewTicketOpen(false)
    setTicketSubject("")
    setTicketDescription("")
    setTicketPriority("medium")
    setTicketCategory("general")
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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Support Tickets
            </h2>
            <Button onClick={() => setIsNewTicketOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>

          <div className="space-y-4">
            {MOCK_TICKETS.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <Card className={`h-full transition-all duration-300 hover:shadow-lg border border-border ${
                  selectedTicket?.id === ticket.id 
                    ? "border-primary shadow-lg ring-2 ring-primary/20" 
                    : "hover:border-primary/50"
                }`}>
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold line-clamp-1 text-foreground">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {ticket.service} - {ticket.provider}
                          </p>
                        </div>
                        <Badge className={`ml-2 whitespace-nowrap ${getStatusColor(ticket.status)} border`}>
                          {ticket.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={`whitespace-nowrap ${getCategoryColor(ticket.category)} border`}>
                          <Tag className="h-3 w-3 mr-1" />
                          {ticket.category}
                        </Badge>
                        <Badge variant="outline" className={`whitespace-nowrap ${getPriorityColor(ticket.priority)} border`}>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {ticket.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{ticket.createdAt}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Updated {ticket.lastUpdate}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedTicket ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Card className="h-full flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedTicket.service} - {selectedTicket.provider}
                        </p>
                      </div>
                      <Badge className={`whitespace-nowrap ${getStatusColor(selectedTicket.status)} border`}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={`whitespace-nowrap ${getCategoryColor(selectedTicket.category)} border`}>
                        <Tag className="h-3 w-3 mr-1" />
                        {selectedTicket.category}
                      </Badge>
                      <Badge variant="outline" className={`whitespace-nowrap ${getPriorityColor(selectedTicket.priority)} border`}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Created: {selectedTicket.createdAt}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Last updated: {selectedTicket.lastUpdate}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-4">
                  <div className="space-y-6">
                    {selectedTicket.messages.map((message: any, index: number) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.1 }}
                        className={`flex ${
                          message.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className={`max-w-[85%] rounded-2xl p-4 ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted rounded-bl-none"
                        }`}>
                          <div className="flex items-center mb-1">
                            {message.sender === "user" ? (
                              <User className="h-4 w-4 mr-2" />
                            ) : (
                              <MessageCircle className="h-4 w-4 mr-2" />
                            )}
                            <span className="text-sm font-medium">
                              {message.sender === "user" ? "You" : "Support Team"}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs mt-2 opacity-70">{message.timestamp}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="shrink-0">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} className="shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full flex items-center justify-center text-center text-muted-foreground p-8"
            >
              <div className="max-w-md">
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
                  <div className="absolute inset-2 bg-primary/20 rounded-full"></div>
                  <MessageCircle className="absolute inset-0 m-auto h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Select a ticket to view the conversation</h3>
                <p className="mb-6 text-muted-foreground">
                  Choose a support ticket from the list to see the conversation history and continue the discussion with our support team.
                </p>
                <Button onClick={() => setIsNewTicketOpen(true)} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Ticket
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Enter ticket subject"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={ticketCategory} onValueChange={setTicketCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={ticketPriority} onValueChange={setTicketPriority}>
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
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachments (optional)</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center transition-colors hover:border-primary/50">
                <Button variant="outline" className="w-full">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload screenshots or relevant documents
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket}>
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}