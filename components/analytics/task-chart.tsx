"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string[]
    borderWidth?: number
  }[]
}

export function TaskAnalyticsChart() {
  const [loading, setLoading] = useState(true)
  const [statusData, setStatusData] = useState<ChartData | null>(null)
  const [priorityData, setPriorityData] = useState<ChartData | null>(null)
  const [trendData, setTrendData] = useState<ChartData | null>(null)

  useEffect(() => {
    fetchChartData()
  }, [])

  async function fetchChartData() {
    setLoading(true)
    try {
      const res = await fetch("/api/analytics/tasks")
      const data = await res.json()

      // Status distribution
      setStatusData({
        labels: ["Open", "In Progress", "Urgent", "Ready", "Closed"],
        datasets: [{
          label: "Tasks by Status",
          data: [
            data.status?.OPEN || 0,
            data.status?.IN_PROGRESS || 0,
            data.status?.URGENT || 0,
            data.status?.READY || 0,
            data.status?.CLOSED || 0,
          ],
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(100, 116, 139, 0.8)",
          ],
          borderColor: ["rgba(255, 255, 255, 0.1)"],
          borderWidth: 1,
        }],
      })

      // Priority distribution
      setPriorityData({
        labels: ["Low", "Medium", "High", "Critical"],
        datasets: [{
          label: "Tasks by Priority",
          data: [
            data.priority?.LOW || 0,
            data.priority?.MEDIUM || 0,
            data.priority?.HIGH || 0,
            data.priority?.CRITICAL || 0,
          ],
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: ["rgba(255, 255, 255, 0.1)"],
          borderWidth: 1,
        }],
      })

      // 7-day trend
      setTrendData({
        labels: data.trend?.labels || [],
        datasets: [{
          label: "Tasks Created",
          data: data.trend?.created || [],
          backgroundColor: ["rgba(59, 130, 246, 0.5)"],
          borderColor: ["rgba(59, 130, 246, 1)"],
          borderWidth: 2,
        }, {
          label: "Tasks Completed",
          data: data.trend?.completed || [],
          backgroundColor: ["rgba(16, 185, 129, 0.5)"],
          borderColor: ["rgba(16, 185, 129, 1)"],
          borderWidth: 2,
        }],
      })

    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-[#8E939D]">Task Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="space-y-4">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="status">By Status</TabsTrigger>
            <TabsTrigger value="priority">By Priority</TabsTrigger>
            <TabsTrigger value="trend">7-Day Trend</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="h-[300px]">
            <SimpleBarChart data={statusData} />
          </TabsContent>

          <TabsContent value="priority" className="h-[300px]">
            <SimplePieChart data={priorityData} />
          </TabsContent>

          <TabsContent value="trend" className="h-[300px]">
            <SimpleLineChart data={trendData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function SimpleBarChart({ data }: { data: ChartData | null }) {
  if (!data) return null

  const maxValue = Math.max(...data.datasets[0].data)

  return (
    <div className="h-full flex items-end gap-4 px-4 pb-8">
      {data.labels.map((label, index) => {
        const value = data.datasets[0].data[index]
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0
        const color = data.datasets[0].backgroundColor?.[index] || "rgba(59, 130, 246, 0.8)"

        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-2">
            <div className="text-sm text-slate-300 font-medium">{value}</div>
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{
                height: `${height}%`,
                backgroundColor: color,
                minHeight: value > 0 ? "4px" : "0",
              }}
            />
            <div className="text-xs text-[#8E939D]0 text-center">{label}</div>
          </div>
        )
      })}
    </div>
  )
}

function SimplePieChart({ data }: { data: ChartData | null }) {
  if (!data) return null

  const total = data.datasets[0].data.reduce((a, b) => a + b, 0)

  return (
    <div className="h-full flex items-center justify-center gap-8">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {data.datasets[0].data.reduce((acc, value, index) => {
            const previousTotal = acc.total
            const percentage = total > 0 ? (value / total) * 100 : 0
            const color = data.datasets[0].backgroundColor?.[index] || "rgba(59, 130, 246, 0.8)"

            if (percentage > 0) {
              const circle = (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={color}
                  strokeWidth="20"
                  strokeDasharray={`${percentage} ${100 - percentage}`}
                  strokeDashoffset={-previousTotal}
                />
              )
              acc.elements.push(circle)
            }
            acc.total += percentage
            return acc
          }, { elements: [] as JSX.Element[], total: 0 }).elements}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#8E939D]">{total}</div>
            <div className="text-xs text-[#8E939D]0">Total</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {data.labels.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.datasets[0].backgroundColor?.[index] }}
            />
            <span className="text-sm text-slate-300">{label}</span>
            <span className="text-sm text-[#8E939D]0 ml-auto">
              {data.datasets[0].data[index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SimpleLineChart({ data }: { data: ChartData | null }) {
  if (!data) return null

  const allValues = data.datasets.flatMap(d => d.data)
  const maxValue = Math.max(...allValues, 1)
  const minValue = Math.min(...allValues, 0)

  return (
    <div className="h-full flex flex-col px-4 pb-4">
      <div className="flex-1 relative">
        <svg className="w-full h-full" preserveAspectRatio="none">
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={`${y}%`}
              x2="100%"
              y2={`${y}%`}
              stroke="rgba(148, 163, 184, 0.1)"
              strokeWidth="1"
            />
          ))}

          {data.datasets.map((dataset, datasetIndex) => {
            const points = dataset.data.map((value, index) => {
              const x = (index / (dataset.data.length - 1)) * 100
              const y = 100 - ((value - minValue) / (maxValue - minValue)) * 100
              return `${x},${y}`
            }).join(" ")

            return (
              <polyline
                key={datasetIndex}
                points={points}
                fill="none"
                stroke={dataset.borderColor?.[0]}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>
      </div>

      <div className="flex justify-between text-xs text-[#8E939D]0 mt-2">
        {data.labels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>

      <div className="flex gap-4 mt-4 justify-center">
        {data.datasets.map((dataset, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: dataset.borderColor?.[0] }}
            />
            <span className="text-sm text-slate-300">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}