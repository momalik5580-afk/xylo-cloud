"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts"
import { Loader2 } from "lucide-react"

interface DeptData { name: string; total: number; completed: number; completionRate: number; pct?: number }
interface TrendDay  { date: string; created: number; completed: number }
interface RecentTask { id: string; title: string; status: string; created_at: string; departments?: { name: string } }

const DEPT_COLORS = ["#10b981","#f59e0b","#f97316","#ef4444","#3b82f6","#8b5cf6"]

export function ActivitySummary() {
  const [depts,   setDepts]   = useState<(DeptData & { pct: number })[]>([])
  const [trend,   setTrend]   = useState<{ day: string; tasks: number; completed: number }[]>([])
  const [tasks,   setTasks]   = useState<RecentTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, statsRes] = await Promise.all([
          fetch("/api/analytics/dashboard?range=week"),
          fetch("/api/dashboard/stats"),
        ])
        const analytics = await analyticsRes.json()
        const stats     = await statsRes.json()

        if (analytics.tasksByDepartment?.length) {
          const totalTasks = analytics.tasksByDepartment.reduce((s: number, d: DeptData) => s + d.total, 0)
          setDepts(
            analytics.tasksByDepartment
              .filter((d: DeptData) => d.total > 0)
              .map((d: DeptData) => ({ ...d, pct: totalTasks ? Math.round((d.total / totalTasks) * 100) : 0 }))
              .slice(0, 6)
          )
        }

        if (analytics.taskTrends?.length) {
          const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
          setTrend(
            analytics.taskTrends.slice(-7).map((t: TrendDay) => ({
              day: DAYS[new Date(t.date).getDay()],
              tasks: t.created,
              completed: t.completed,
            }))
          )
        }

        if (stats.recentTasks?.length) setTasks(stats.recentTasks.slice(0, 5))
      } catch (e) {
        console.error("ActivitySummary:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  if (loading) {
    return (
      <Card className="border border-slate-800/60 bg-slate-900/80 flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </Card>
    )
  }

  const pieData = depts.map((d, i) => ({ name: d.name, value: d.pct, color: DEPT_COLORS[i % DEPT_COLORS.length] }))
  const topPct  = pieData[0]?.value ?? 0

  return (
    <Card className="border border-slate-800/60 bg-slate-900/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#8E939D]">Activity Summary</CardTitle>
          <Badge variant="outline" className="text-xs bg-slate-800/50">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Pie */}
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-3">Workload Distribution</h4>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-[#8E939D]">{topPct}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-400 truncate max-w-[80px]">{item.name}</span>
                  </div>
                  <span className="font-medium text-[#8E939D]">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Trend */}
        {trend.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-slate-400 mb-2">Weekly Trend</h4>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px" }} labelStyle={{ color: "#94a3b8" }} />
                  <Line type="monotone" dataKey="tasks"     stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", strokeWidth: 0, r: 3 }} />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", strokeWidth: 0, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Dept bars */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-400">Department Workload</h4>
          {depts.slice(0, 3).map((dept, i) => (
            <div key={dept.name} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-24 truncate">{dept.name}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${dept.pct}%`, backgroundColor: DEPT_COLORS[i] }} />
              </div>
              <span className="text-xs font-medium text-slate-300 w-8">{dept.pct}%</span>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">Recent Activity</h4>
          <div className="space-y-2">
            {tasks.length === 0 && <p className="text-xs text-slate-500">No recent tasks</p>}
            {tasks.map((t) => (
              <div key={t.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${["CRITICAL","URGENT"].includes(t.status) ? "bg-red-500" : "bg-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">{t.title}</p>
                  <span className="text-[10px] text-slate-500">
                    {t.departments?.name ?? "General"} · {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
