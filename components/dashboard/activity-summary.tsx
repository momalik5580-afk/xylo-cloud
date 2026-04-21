"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"

interface DeptData { 
  name: string
  total: number
  completed: number
  pct?: number 
}

interface RecentTask {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
  createdAt?: string
  assignedTo?: { 
    firstName: string
    lastName: string 
  } | null
}

// High-tech Electric Cyan & Deep Blue neon theme
const DEPT_COLORS = ["#00f2ff", "#0ea5e9", "#6366f1", "#8b5cf6"]

const DEPT_ORDER = ["Housekeeping", "Engineering", "F&B", "Security"]

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

// Dot color based on priority — matches screenshot
function getIncidentDot(priority: string): string {
  switch (priority?.toUpperCase()) {
    case "CRITICAL":
    case "HIGH":    return "bg-red-500"
    case "MEDIUM":  return "bg-amber-400"
    default:        return "bg-orange-500"
  }
}

export function ActivitySummary() {
  const [depts, setDepts] = useState<(DeptData & { pct: number; color: string })[]>([])
  const [tasks, setTasks] = useState<RecentTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, statsRes] = await Promise.all([
          fetch("/api/analytics/dashboard?range=all"),
          fetch("/api/dashboard/stats"),
        ])
        const analytics = await analyticsRes.json()
        const stats = await statsRes.json()

        // Process department data - max 4 departments like screenshot
        if (analytics.tasksByDepartment?.length) {
          const totalTasks = analytics.tasksByDepartment.reduce(
            (s: number, d: DeptData) => s + d.total, 0
          )
          
          const sorted = [...analytics.tasksByDepartment]
            .filter((d: DeptData) => d.total > 0)
            .sort((a: DeptData, b: DeptData) => {
              const ai = DEPT_ORDER.findIndex(o => a.name.includes(o))
              const bi = DEPT_ORDER.findIndex(o => b.name.includes(o))
              return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
            })
            .slice(0, 4)
            .map((d: DeptData, i: number) => ({
              ...d,
              pct: totalTasks ? Math.round((d.total / totalTasks) * 100) : 0,
              color: DEPT_COLORS[i % DEPT_COLORS.length],
            }))
          
          setDepts(sorted)
        }

        // Get recent tasks - max 3 like screenshot
        if (stats.recentTasks?.length) {
          setTasks(stats.recentTasks.slice(0, 3))
        }
      } catch (e) {
        console.error("ActivitySummary:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const iv = setInterval(load, 30_000)
    return () => clearInterval(iv)
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#00f2ff]/20 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.05)] hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden flex items-center justify-center h-64">
        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <Loader2 className="h-6 w-6 animate-spin text-[#00f2ff] relative z-10" />
      </div>
    )
  }

  const pieData = depts.map((d) => ({ 
    name: d.name, 
    value: d.pct, 
    color: d.color 
  }))
  
  // Top percentage for center of donut (Housekeeping = 45% in screenshot)
  const topPct = pieData[0]?.value ?? 0

  return (
    <div className="rounded-2xl border border-[#00f2ff]/20 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.05)] hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#00f2ff]/15 relative z-10">
        <span className="text-sm font-bold text-[#00f2ff] tracking-wider drop-shadow-[0_0_8px_rgba(0,242,255,0.15)]">ACTIVITY SUMMARY</span>
        <span className="flex items-center gap-1.5 rounded-full border border-[#00f2ff]/40 bg-[#00f2ff]/10 px-2.5 py-0.5 shadow-[0_0_10px_rgba(0,242,255,0.2)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00f2ff] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00f2ff] shadow-[0_0_5px_rgba(0,242,255,0.8)]" />
          </span>
          <span className="text-[10px] font-bold text-[#00f2ff] tracking-widest">LIVE</span>
        </span>
      </div>

      <div className="px-5 pb-5 space-y-5 relative z-10">
        
        {/* Workload Distribution */}
        <div>
          <p className="text-[10px] font-semibold text-[#5C6270] uppercase tracking-wider mb-3">
            Workload Distribution
          </p>
          
          <div className="flex items-center gap-5">
            {/* Donut Chart */}
            <div className="relative h-24 w-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" 
                    cy="50%"
                    innerRadius={28} 
                    outerRadius={44}
                    paddingAngle={0}
                    dataKey="value"
                    startAngle={90} 
                    endAngle={-270}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]">{topPct}%</span>
              </div>
            </div>

            {/* Legend - beside donut like screenshot */}
            <div className="flex-1 space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="text-[#8E939D]">{item.name}</span>
                  </div>
                  <span className="font-bold text-[#8E939D] tabular-nums">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Workload - Progress Bars */}
        <div>
          <p className="text-[10px] font-semibold text-[#5C6270] uppercase tracking-wider mb-3">
            Department Workload
          </p>
          
          <div className="space-y-2.5">
            {depts.slice(0, 3).map((dept) => (
              <div key={dept.name} className="flex items-center gap-3">
                <span className="text-xs text-[#8E939D] w-20 truncate">
                  {dept.name}
                </span>
                <div className="flex-1 h-2 bg-[#00f2ff]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${dept.pct}%`, 
                      backgroundColor: dept.color 
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-[#8E939D] w-8 text-right tabular-nums">
                  {dept.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Incidents */}
        <div>
          <p className="text-[10px] font-semibold text-[#5C6270] uppercase tracking-wider mb-3">
            Live Incidents
          </p>
          
          <div className="space-y-2.5">
            {tasks.length === 0 && (
              <p className="text-[10px] text-[#5C6270]">No active incidents</p>
            )}
            
            {tasks.map((task) => {
              const dateStr = task.createdAt ?? task.created_at
              // Handle both camelCase and snake_case API responses
              const assignee = task.assignedTo
                ? `${(task.assignedTo as any).firstName ?? (task.assignedTo as any).first_name ?? ""} ${(task.assignedTo as any).lastName ?? (task.assignedTo as any).last_name ?? ""}`.trim()
                : null
              
              // Format: "Title: Assignee" like screenshot examples
              const displayTitle = assignee 
                ? `${task.title}: ${assignee}`
                : task.title

              const dotColor = getIncidentDot(task.priority)

              return (
                <div key={task.id} className="flex items-start gap-3">
                  {/* Priority-colored dot */}
                  <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${dotColor}`} />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#8E939D] leading-snug truncate">
                      {displayTitle}
                    </p>
                  </div>
                  
                  <span className="text-[9px] font-medium text-[#5C6270] flex-shrink-0 tabular-nums">
                    {dateStr ? timeAgo(dateStr) : "—"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}