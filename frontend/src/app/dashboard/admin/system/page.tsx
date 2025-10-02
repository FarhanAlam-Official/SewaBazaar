"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Server, 
  Database, 
  Wifi, 
  HardDrive, 
  Zap,
  CheckCircle2,
  RefreshCw,
  Activity,
  Users,
  ShoppingBag,
  Calendar,
  DollarSign
} from "lucide-react"
import { showToast } from "@/components/ui/enhanced-toast"

interface SystemStatus {
  api: "online" | "offline" | "degraded"
  database: "online" | "offline" | "degraded"
  storage: "online" | "offline" | "degraded"
  network: "online" | "offline" | "degraded"
}

interface ResourceUsage {
  cpu: number
  memory: number
  disk: number
  network: number
}

interface PerformanceMetrics {
  responseTime: number
  uptime: number
  errorRate: number
  throughput: number
}

interface ActiveCounts {
  users: number
  services: number
  bookings: number
  providers: number
}

export default function SystemMonitoringPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    api: "online",
    database: "online",
    storage: "online",
    network: "online"
  })
  
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage>({
    cpu: 45,
    memory: 62,
    disk: 28,
    network: 15
  })
  
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    responseTime: 124,
    uptime: 99.98,
    errorRate: 0.02,
    throughput: 1250
  })
  
  const [activeCounts, setActiveCounts] = useState<ActiveCounts>({
    users: 1242,
    services: 86,
    bookings: 342,
    providers: 128
  })
  
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [loading, setLoading] = useState<boolean>(false)

  // Simulate fetching real-time data
  const fetchSystemData = useCallback(async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from your API
      // For now, we'll simulate with random data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Randomly update some values to simulate changes
      setResourceUsage(prev => ({
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.min(100, Math.max(0, prev.memory + (Math.random() * 10 - 5))),
        disk: Math.min(100, Math.max(0, prev.disk + (Math.random() * 2 - 1))),
        network: Math.min(100, Math.max(0, prev.network + (Math.random() * 20 - 10)))
      }))
      
      setPerformanceMetrics(prev => ({
        responseTime: Math.max(50, prev.responseTime + (Math.random() * 20 - 10)),
        uptime: Math.min(100, Math.max(99, prev.uptime + (Math.random() * 0.01 - 0.005))),
        errorRate: Math.max(0, prev.errorRate + (Math.random() * 0.01 - 0.005)),
        throughput: Math.max(0, prev.throughput + (Math.random() * 50 - 25))
      }))
      
      setLastUpdated(new Date())
      showToast.success({
        title: "System Data Refreshed",
        description: "Latest system metrics have been updated",
        duration: 3000
      })
    } catch (error) {
      console.error("Error fetching system data:", error)
      showToast.error({
        title: "Error",
        description: "Failed to refresh system data",
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }, [setResourceUsage, setPerformanceMetrics, setLastUpdated, showToast])

  useEffect(() => {
    // Set up interval to refresh data every 5 minutes
    const interval = setInterval(fetchSystemData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSystemData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500"
      case "degraded": return "bg-yellow-500"
      case "offline": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "online": return "success"
      case "degraded": return "warning"
      case "offline": return "destructive"
      default: return "secondary"
    }
  }

  const getHealthStatus = () => {
    const statuses = Object.values(systemStatus)
    if (statuses.every(status => status === "online")) return "healthy"
    if (statuses.some(status => status === "offline")) return "critical"
    return "warning"
  }

  const healthStatus = getHealthStatus()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time overview of system health and performance metrics
          </p>
        </div>
        <Button 
          onClick={fetchSystemData} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`border-l-4 ${
          healthStatus === "healthy" ? "border-l-green-500" :
          healthStatus === "warning" ? "border-l-yellow-500" :
          "border-l-red-500"
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {healthStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCounts.users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCounts.bookings}</div>
            <p className="text-xs text-muted-foreground">+5% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.responseTime < 200 ? "Excellent" : "Good"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${getStatusColor(systemStatus.api)}`}></div>
              <Badge variant={getStatusVariant(systemStatus.api)}>
                {systemStatus.api}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${getStatusColor(systemStatus.database)}`}></div>
              <Badge variant={getStatusVariant(systemStatus.database)}>
                {systemStatus.database}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${getStatusColor(systemStatus.storage)}`}></div>
              <Badge variant={getStatusVariant(systemStatus.storage)}>
                {systemStatus.storage}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${getStatusColor(systemStatus.network)}`}></div>
              <Badge variant={getStatusVariant(systemStatus.network)}>
                {systemStatus.network}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <span>{resourceUsage.cpu.toFixed(1)}%</span>
              </div>
              <Progress value={resourceUsage.cpu} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{resourceUsage.memory.toFixed(1)}%</span>
              </div>
              <Progress value={resourceUsage.memory} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Disk Usage</span>
                <span>{resourceUsage.disk.toFixed(1)}%</span>
              </div>
              <Progress value={resourceUsage.disk} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Network I/O</span>
                <span>{resourceUsage.network.toFixed(1)}%</span>
              </div>
              <Progress value={resourceUsage.network} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Uptime</span>
              <span className="font-medium">{performanceMetrics.uptime.toFixed(2)}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Error Rate</span>
              <span className="font-medium">{performanceMetrics.errorRate.toFixed(3)}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Throughput</span>
              <span className="font-medium">{performanceMetrics.throughput} req/s</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Avg. Response Time</span>
              <span className="font-medium">{performanceMetrics.responseTime}ms</span>
            </div>
            
            <div className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>All systems operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Entities */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-xl font-bold">{activeCounts.users.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Services</p>
                <p className="text-xl font-bold">{activeCounts.services}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-purple-100 rounded-full">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bookings</p>
                <p className="text-xl font-bold">{activeCounts.bookings}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-orange-100 rounded-full">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Providers</p>
                <p className="text-xl font-bold">{activeCounts.providers}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}