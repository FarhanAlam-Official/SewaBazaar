"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Calendar,
  Download,
  Clock,
  Filter,
  TrendingUp,
  Loader2,
  RefreshCw,
  FileText,
  BarChart3
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useProviderEarnings } from '@/hooks/useProviderEarnings'

export default function EarningsAndFinance() {
  const { toast } = useToast()
  const {
    earningsData,
    earningsAnalytics,
    loading,
    error,
    refreshEarnings,
    refreshAnalytics,
    exportEarnings
  } = useProviderEarnings()

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [isExporting, setIsExporting] = useState(false)

  // Handle period change for analytics
  const handlePeriodChange = async (period: 'week' | 'month' | 'year') => {
    setSelectedPeriod(period)
    await refreshAnalytics(period)
  }

  // Handle export functionality
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setIsExporting(true)
      await exportEarnings(format, selectedPeriod)
      toast({
        title: "Export Successful",
        description: `Earnings report exported as ${format.toUpperCase()}`
      })
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export earnings report",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Calculate growth percentage
  const calculateGrowth = (current: number, previous: number): { percentage: number, isPositive: boolean } => {
    if (previous === 0) return { percentage: 0, isPositive: true }
    const percentage = ((current - previous) / previous) * 100
    return { percentage: Math.abs(percentage), isPositive: percentage >= 0 }
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `NPR ${amount.toLocaleString()}`
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return {
          icon: <ArrowUpRight className="h-5 w-5 text-green-600" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-600'
        }
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600'
        }
      default:
        return {
          icon: <CreditCard className="h-5 w-5 text-gray-600" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600'
        }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading earnings data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={refreshEarnings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!earningsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No earnings data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Earnings & Finance</h1>
          <p className="text-muted-foreground">Track your earnings and financial performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshEarnings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleExport('csv')} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <h3 className="text-2xl font-bold">{formatCurrency(earningsData.summary.totalEarnings)}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All time earnings
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
              <h3 className="text-2xl font-bold">{formatCurrency(earningsData.summary.thisMonth)}</h3>
              {earningsAnalytics && (
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {earningsAnalytics.total_bookings} bookings
                </p>
              )}
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
              <h3 className="text-2xl font-bold">{formatCurrency(earningsData.summary.pending)}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {earningsData.summary.nextPayoutDate 
                  ? `Next payout: ${formatDate(earningsData.summary.nextPayoutDate)}`
                  : 'No scheduled payout'
                }
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
              <p className="text-sm text-muted-foreground">Average Booking Value</p>
              <h3 className="text-2xl font-bold">
                {earningsAnalytics 
                  ? formatCurrency(earningsAnalytics.average_per_booking)
                  : formatCurrency(0)
                }
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Per completed booking
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Period Selector */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Analytics Overview</h2>
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Earnings Chart */}
      {earningsData.monthlyTrends.length > 0 && (
        <Card className="mb-6 p-6">
          <h3 className="text-lg font-semibold mb-4">Earnings Trend</h3>
          <ChartContainer
            config={{
              netEarnings: {
                label: "Net Earnings",
                color: "hsl(var(--primary))",
              },
              grossEarnings: {
                label: "Gross Earnings",
                color: "hsl(var(--muted-foreground))",
              },
            }}
            className="h-[300px]"
          >
            <AreaChart
              data={earningsData.monthlyTrends.slice(-6).map(trend => ({
                month: new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                netEarnings: trend.netEarnings,
                grossEarnings: trend.grossEarnings,
                bookings: trend.bookingsCount
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === 'netEarnings' ? 'Net Earnings' : 'Gross Earnings'
                ]}
              />
              <Area
                type="monotone"
                dataKey="grossEarnings"
                stackId="1"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="netEarnings"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </Card>
      )}

      {/* Monthly Trends Details */}
      {earningsData.monthlyTrends.length > 0 && (
        <Card className="mb-6 p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
          <div className="space-y-4">
            {earningsData.monthlyTrends.slice(-6).map((trend, index) => (
              <div key={trend.month} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium">
                    {new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Gross: {formatCurrency(trend.grossEarnings)}</span>
                      <span>Net: {formatCurrency(trend.netEarnings)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${Math.min((trend.netEarnings / Math.max(...earningsData.monthlyTrends.map(t => t.netEarnings))) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{trend.bookingsCount} bookings</div>
                  <div className="text-xs text-muted-foreground">
                    Fee: {formatCurrency(trend.platformFee)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="mb-6">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
        <div className="divide-y">
          {earningsData.recentTransactions.length > 0 ? (
            earningsData.recentTransactions.map((transaction) => {
              const statusDisplay = getStatusDisplay(transaction.status)
              return (
                <div key={transaction.id} className="p-4 hover:bg-muted/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full ${statusDisplay.bgColor} flex items-center justify-center`}>
                        {statusDisplay.icon}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.service_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.customer_name} • {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                      <p className={`text-sm ${statusDisplay.textColor}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No recent transactions</p>
            </div>
          )}
        </div>
      </Card>

      {/* Additional Analytics */}
      {earningsAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Earnings Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Earnings</span>
                <span className="font-medium">{formatCurrency(earningsAnalytics.total_earnings)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Bookings</span>
                <span className="font-medium">{earningsAnalytics.total_bookings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average per Booking</span>
                <span className="font-medium">{formatCurrency(earningsAnalytics.average_per_booking)}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Period</span>
                  <span className="text-sm font-medium">{earningsAnalytics.period}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              {earningsAnalytics.earnings_data.slice(-5).map((data, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{data.period}</p>
                    <p className="text-xs text-muted-foreground">{data.bookings_count} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(data.earnings)}</p>
                    <div className="w-16 h-1 bg-muted rounded-full mt-1">
                      <div 
                        className="h-1 bg-primary rounded-full" 
                        style={{ 
                          width: `${Math.min((data.earnings / Math.max(...earningsAnalytics.earnings_data.map(d => d.earnings))) * 100, 100)}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
} 