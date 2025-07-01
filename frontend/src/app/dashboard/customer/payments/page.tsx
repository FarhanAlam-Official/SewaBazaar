"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CreditCard, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react"

// Temporary mock data
const MOCK_PAYMENT_METHODS = [
  {
    id: "1",
    type: "Khalti",
    number: "98XXXXXXXX",
    isDefault: true
  },
  {
    id: "2",
    type: "eSewa",
    number: "98XXXXXXXX",
    isDefault: false
  }
]

const MOCK_TRANSACTIONS = [
  {
    id: "1",
    type: "payment",
    amount: 2500,
    service: "House Cleaning",
    provider: "CleanPro Services",
    date: "2024-03-15",
    status: "completed"
  },
  {
    id: "2",
    type: "refund",
    amount: 1500,
    service: "Plumbing Service",
    provider: "FixIt Pro",
    date: "2024-03-10",
    status: "processing"
  }
]

export default function PaymentsPage() {
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isTopUpOpen, setIsTopUpOpen] = useState(false)
  const [walletBalance] = useState(5000) // Mock balance

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">Rs. {walletBalance}</p>
                <p className="text-sm text-muted-foreground">Available Balance</p>
              </div>
              <Button onClick={() => setIsTopUpOpen(true)}>Top Up</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payment Methods</CardTitle>
            <Button variant="outline" onClick={() => setIsAddPaymentOpen(true)}>
              Add New
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_PAYMENT_METHODS.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-6 w-6" />
                    <div>
                      <p className="font-medium">{method.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {method.number}
                      </p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="text-sm text-muted-foreground">Default</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_TRANSACTIONS.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {transaction.type === "payment" ? (
                    <ArrowUpRight className="h-6 w-6 text-red-500" />
                  ) : (
                    <ArrowDownLeft className="h-6 w-6 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium">{transaction.service}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.provider}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.type === "payment" ? "text-red-500" : "text-green-500"
                  }`}>
                    {transaction.type === "payment" ? "-" : "+"}
                    Rs. {transaction.amount}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 space-y-2">
                <Wallet className="h-6 w-6" />
                <span>Khalti</span>
              </Button>
              <Button variant="outline" className="h-24 space-y-2">
                <Wallet className="h-6 w-6" />
                <span>eSewa</span>
              </Button>
            </div>
            <Input placeholder="Enter mobile number" />
            <Button className="w-full">Add Payment Method</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline">Rs. 500</Button>
              <Button variant="outline">Rs. 1000</Button>
              <Button variant="outline">Rs. 2000</Button>
              <Button variant="outline">Rs. 5000</Button>
            </div>
            <Input type="number" placeholder="Enter custom amount" />
            <Button className="w-full">Proceed to Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 