import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DataPoint {
  name: string
  value: number
  [key: string]: any
}

interface AnalyticsChartProps {
  title: string
  data: DataPoint[]
  type?: "line" | "area" | "bar"
  dataKey?: string
  height?: number
  className?: string
  showGrid?: boolean
  showTooltip?: boolean
  showAxis?: boolean
  gradientFrom?: string
  gradientTo?: string
}

export function AnalyticsChart({
  title,
  data,
  type = "line",
  dataKey = "value",
  height = 350,
  className,
  showGrid = true,
  showTooltip = true,
  showAxis = true,
  gradientFrom = "rgba(59, 130, 246, 0.2)",
  gradientTo = "rgba(59, 130, 246, 0)",
}: AnalyticsChartProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 20, bottom: 5, left: 0 },
    }

    switch (type) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxis && (
              <>
                <XAxis dataKey="name" />
                <YAxis />
              </>
            )}
            {showTooltip && <Tooltip />}
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.8} />
                <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#gradient)"
            />
          </AreaChart>
        )
      case "bar":
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxis && (
              <>
                <XAxis dataKey="name" />
                <YAxis />
              </>
            )}
            {showTooltip && <Tooltip />}
            <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        )
      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxis && (
              <>
                <XAxis dataKey="name" />
                <YAxis />
              </>
            )}
            {showTooltip && <Tooltip />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        )
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 