"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ServiceCard } from "@/components/services/ServiceCard"
import { Tag, Copy, Gift, Clock } from "lucide-react"

// Temporary mock data
const MOCK_ACTIVE_COUPONS = [
  {
    id: "1",
    code: "WELCOME50",
    discount: 50,
    type: "percentage",
    minAmount: 1000,
    maxDiscount: 500,
    validUntil: "2024-04-15",
    description: "50% off on your first booking"
  },
  // Add more coupons...
]

const MOCK_EXPIRED_COUPONS = [
  {
    id: "2",
    code: "SUMMER30",
    discount: 30,
    type: "percentage",
    minAmount: 1500,
    maxDiscount: 300,
    validUntil: "2024-03-01",
    description: "Summer special discount"
  },
  // Add more coupons...
]

const MOCK_DISCOUNTED_SERVICES = [
  {
    id: "1",
    name: "Deep House Cleaning",
    provider: "CleanPro Services",
    image: "/placeholder.jpg",
    rating: 4.8,
    price: 3000,
    discountedPrice: 2400,
    location: "Kathmandu"
  },
  // Add more services...
]

export default function OffersPage() {
  const [activeTab, setActiveTab] = useState("active")
  const [referralCode, setReferralCode] = useState("")
  const [isRedeemOpen, setIsRedeemOpen] = useState(false)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    // Add toast notification here
  }

  const handleRedeemCode = () => {
    // Handle redeem logic
    console.log("Redeeming code:", referralCode)
    setIsRedeemOpen(false)
    setReferralCode("")
  }

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Available Coupons</CardTitle>
                <Button variant="outline" onClick={() => setIsRedeemOpen(true)}>
                  Redeem Code
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="expired">Expired</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  <div className="space-y-4">
                    {MOCK_ACTIVE_COUPONS.map((coupon) => (
                      <Card key={coupon.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                <h3 className="font-semibold">{coupon.code}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {coupon.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Min. Order: Rs. {coupon.minAmount}</span>
                                <span>Max Discount: Rs. {coupon.maxDiscount}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4" />
                                <span>Valid until {coupon.validUntil}</span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyCode(coupon.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="expired">
                  <div className="space-y-4">
                    {MOCK_EXPIRED_COUPONS.map((coupon) => (
                      <Card key={coupon.id} className="opacity-60">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                <h3 className="font-semibold">{coupon.code}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {coupon.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Min. Order: Rs. {coupon.minAmount}</span>
                                <span>Max Discount: Rs. {coupon.maxDiscount}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-red-500">
                                <Clock className="h-4 w-4" />
                                <span>Expired on {coupon.validUntil}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Services with Discounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_DISCOUNTED_SERVICES.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={{
                      ...service,
                      price: service.discountedPrice,
                    }}
                    variant="default"
                    onAction={() => {}}
                    actionLabel="Book Now"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Refer & Earn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-4 rounded-full bg-primary/10">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">Get Rs. 500 for every referral</h3>
              <p className="text-sm text-muted-foreground">
                Share your referral code with friends and earn rewards when they make their first booking
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Referral Code</p>
              <div className="flex gap-2">
                <Input value="JOHN500" readOnly />
                <Button variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full">Share Code</Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Coupon Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter coupon code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
            <Button className="w-full" onClick={handleRedeemCode}>
              Redeem
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 