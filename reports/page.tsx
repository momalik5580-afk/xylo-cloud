"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskAnalyticsChart } from "@/components/analytics/task-chart"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  BarChart3, 
  Users, 
  Clock,
  Loader2
} from "lucide-react"
import { toast } from "react-hot-toast"

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() })

  async function exportReport(type: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/export?type=${type}&from=${dateRange.from}&to=${dateRange.to}`)
      
      if (!res.ok) throw new Error("Export failed")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `xylo-report-${type}-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Report downloaded successfully")
    } catch (error) {
      toast.error("Failed to export report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-[#8E939D]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#8E939D]">Reports & Analytics</h1>
            <p className="text-sm text-slate-400">View performance metrics and export reports</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => exportReport("full")}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Tasks</p>
                <p className="text-2xl font-bold text-[#8E939D]">1,284</p>
                <p className="text-xs text-emerald-400">+12% vs last month</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Completion Rate</p>
                <p className="text-2xl font-bold text-[#8E939D]">87.3%</p>
                <p className="text-xs text-emerald-400">+5% vs last month</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Staff</p>
                <p className="text-2xl font-bold text-[#8E939D]">42</p>
                <p className="text-xs text-slate-500">Across 5 departments</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Users className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-[#8E939D]">4.2m</p>
                <p className="text-xs text-emerald-400">-30s vs last month</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Reports */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="sla">SLA Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TaskAnalyticsChart />
            
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-[#8E939D]">Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { dept: "Housekeeping", tasks: 145, efficiency: 94, color: "bg-emerald-500" },
                    { dept: "Engineering", tasks: 89, efficiency: 88, color: "bg-amber-500" },
                    { dept: "Guest Services", tasks: 234, efficiency: 96, color: "bg-blue-500" },
                    { dept: "F&B", tasks: 178, efficiency: 91, color: "bg-orange-500" },
                    { dept: "Security", tasks: 45, efficiency: 98, color: "bg-red-500" },
                  ].map((item) => (
                    <div key={item.dept} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">{item.dept}</span>
                        <span className="text-slate-400">{item.tasks} tasks • {item.efficiency}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${item.efficiency}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center">
              <p className="text-slate-500">Department detailed reports coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center">
              <p className="text-slate-500">Staff performance reports coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center">
              <p className="text-slate-500">SLA analysis reports coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Export Buttons */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-[#8E939D]">Quick Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => exportReport("tasks")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Tasks Report
            </Button>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => exportReport("inventory")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Inventory Report
            </Button>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => exportReport("staff")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Staff Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}