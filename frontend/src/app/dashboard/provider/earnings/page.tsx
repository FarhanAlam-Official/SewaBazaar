"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Calendar,
  Download,
  Clock,
  Filter
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function EarningsAndFinance() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Earnings & Finance</h1>
          <p className="text-muted-foreground">Track your earnings and financial performance</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <h3 className="text-2xl font-bold">NPR 125,000</h3>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                12% from last month
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <h3 className="text-2xl font-bold">NPR 45,000</h3>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                8% from last month
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Pending Payouts</p>
              <h3 className="text-2xl font-bold">NPR 15,000</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Next payout in 2 days
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Completed Jobs</p>
              <h3 className="text-2xl font-bold">48</h3>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                3% from last month
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="mb-6">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Select defaultValue="this-month">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="three-months">Last 3 Months</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="divide-y">
          {/* Transaction Item */}
          <div className="p-4 hover:bg-muted/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">House Cleaning Service</p>
                  <p className="text-sm text-muted-foreground">Mar 15, 2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">NPR 2,500</p>
                <p className="text-sm text-green-600">Completed</p>
              </div>
            </div>
          </div>

          <div className="p-4 hover:bg-muted/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Deep Cleaning Package</p>
                  <p className="text-sm text-muted-foreground">Mar 14, 2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">NPR 4,500</p>
                <p className="text-sm text-green-600">Completed</p>
              </div>
            </div>
          </div>

          <div className="p-4 hover:bg-muted/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">Office Cleaning</p>
                  <p className="text-sm text-muted-foreground">Mar 13, 2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">NPR 3,500</p>
                <p className="text-sm text-yellow-600">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Earnings by Service</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>House Cleaning</span>
                <span className="font-medium">NPR 45,000</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div className="h-2 bg-primary rounded-full" style={{ width: "65%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Deep Cleaning</span>
                <span className="font-medium">NPR 35,000</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div className="h-2 bg-primary rounded-full" style={{ width: "45%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Office Cleaning</span>
                <span className="font-medium">NPR 25,000</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div className="h-2 bg-primary rounded-full" style={{ width: "35%" }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Job Value</p>
                <p className="text-lg font-medium">NPR 3,250</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jobs Completed</p>
                <p className="text-lg font-medium">48</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Hours</p>
                <p className="text-lg font-medium">156</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Top Performing Days</p>
              <div className="grid grid-cols-7 gap-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div
                    key={i}
                    className={`h-8 rounded-sm flex items-center justify-center text-xs
                      ${i === 1 || i === 4 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 