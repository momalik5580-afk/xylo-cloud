"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TaskDetailModal } from "./task-detail-modal"
import { MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description: string
  type: string
  priority: string
  status: string
  location: string
  locationType: string
  isVip: boolean
  createdAt: string
  department: {
    id: string
    name: string
    code: string
  }
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  } | null
}

interface TaskListProps {
  title?: string
  showCreateButton?: boolean
  onCreateClick?: () => void
  departmentFilter?: string
}

// ─── SLA thresholds in minutes per priority ──────────────────────────────────
const SLA_MINUTES: Record<string, number> = {
  CRITICAL: 30,
  HIGH:     60,
  MEDIUM:   120,
  LOW:      240,
}

function useEscalationTimers(tasks: Task[]) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])
  return { now }
}

function getEscalationInfo(task: Task, now: number) {
  const created  = new Date(task.createdAt).getTime()
  const elapsed  = Math.floor((now - created) / 1000) // seconds elapsed since creation
  const slaSecs  = (SLA_MINUTES[task.priority] ?? 120) * 60
  const remaining = slaSecs - elapsed // negative = overdue

  const pct   = Math.min(100, (elapsed / slaSecs) * 100)
  const level =
    remaining < 0               ? "overdue"    :
    pct > 80                    ? "sla-warn"   :
    task.priority === "CRITICAL" ? "to-level-2" :
    "normal"

  const label =
    remaining < 0     ? "Overdue"    :
    pct > 80          ? "SLA warn"   :
    task.priority === "CRITICAL" || task.priority === "HIGH" ? "to Level 2" :
    "on track"

  // For overdue: show time since breach (elapsed - slaSecs), capped at 99:59
  // For on-track: show remaining time countdown
  let displaySecs: number
  if (remaining < 0) {
    displaySecs = Math.min(Math.abs(remaining), 99 * 60 + 59) // cap at 99:59
  } else {
    displaySecs = remaining
  }

  const mm  = Math.floor(displaySecs / 60)
  const ss  = displaySecs % 60
  const fmt = `${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`

  return { fmt, level, label, remaining, pct }
}

// Filter bar tabs
const STATUS_TABS = ["All", "High", "VIP"] as const
type StatusTab = typeof STATUS_TABS[number]

export function TaskList({
  title = "Running Tasks",
  showCreateButton = false,
  onCreateClick,
  departmentFilter,
}: TaskListProps) {
  const [tasks,          setTasks]          = useState<Task[]>([])
  const [loading,        setLoading]        = useState(true)
  const [activeTab,      setActiveTab]      = useState<StatusTab>("All")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [detailModalOpen,setDetailModalOpen]= useState(false)
  const { now } = useEscalationTimers(tasks)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res  = await fetch("/api/tasks")
      const data = await res.json()
      let fetched: Task[] = data.tasks || []
      if (departmentFilter) {
        fetched = fetched.filter((t) => t.department?.code === departmentFilter)
      }
      // Only show active tasks on main dashboard
      setTasks(fetched.filter((t) => !["CLOSED","COMPLETED"].includes(t.status)))
    } catch (err) {
      console.error("TaskList fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "High": return tasks.filter((t) => t.priority === "HIGH" || t.priority === "CRITICAL")
      case "VIP":  return tasks.filter((t) => t.isVip)
      default:     return tasks
    }
  }, [tasks, activeTab])

  function getPriorityDot(priority: string) {
    const colors: Record<string, string> = {
      CRITICAL: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
      HIGH:     "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]",
      MEDIUM:   "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
      LOW:      "bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.8)]",
    }
    return colors[priority] ?? "bg-[#5C6270]"
  }

  function getDeptColor(code: string) {
    const colors: Record<string, string> = {
      HK:  "bg-emerald-500/20 text-emerald-400",
      ENG: "bg-amber-500/20 text-amber-400",
      FNB: "bg-orange-500/20 text-orange-400",
      RNB: "bg-orange-500/20 text-orange-400",
      SEC: "bg-red-500/20 text-red-400",
      GS:  "bg-blue-500/20 text-blue-400",
      RS:  "bg-slate-500/20 text-slate-300",
      FO:  "bg-blue-500/20 text-blue-400",
    }
    return colors[code] ?? "bg-slate-500/20 text-slate-400"
  }

  function getDeptLabel(code: string, name: string) {
    // Show full name for main dept tabs like in screenshot
    const labels: Record<string, string> = {
      HK:          "Houseseing",
      HOUSEKEEPING:"Houseseing",
      ENG:         "Engineering",
      ENGINEERING: "Engineering",
      FNB:         "F&B",
      RNB:         "F&B",
      "F&B":       "F&B",
      SEC:         "Security",
      SECURITY:    "Security",
      GS:          "Guest Service",
      RS:          "Room Service",
      FO:          "Front Desk",
      FRONT_OFFICE:"Front Desk",
    }
    return labels[code] ?? name ?? code
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "IN_PROGRESS": return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "URGENT":      return "bg-red-500/20 text-red-300 border-red-500/30 animate-pulse"
      case "OPEN":        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      case "READY":       return "bg-teal-500/20 text-teal-300 border-teal-500/30"
      default:            return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "IN_PROGRESS": return "In Progress"
      case "URGENT":      return "Urgent"
      case "OPEN":        return "Open"
      case "READY":       return "Ready"
      default:            return status.replace("_"," ")
    }
  }

  function getEscalationColor(level: string) {
    switch (level) {
      case "overdue":    return "text-red-400"
      case "sla-warn":   return "text-amber-400"
      case "to-level-2": return "text-red-300"
      default:           return "text-emerald-400"
    }
  }

  if (loading) {
    return (
      <Card className="bg-[#0a0c10] border-[#00f2ff]/10 shadow-[0_0_15px_rgba(0,242,255,0.02)]">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#00f2ff]/40" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-[#0a0c10] border-[#00f2ff]/20 shadow-[0_0_15px_rgba(0,242,255,0.02)] h-full flex flex-col relative overflow-hidden group/main hover:border-[#00f2ff]/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] hover:bg-[#00f2ff]/5 transition-all duration-300">
        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/main:opacity-100 transition-opacity pointer-events-none" />
        <CardHeader className="pb-3 border-b border-[#00f2ff]/10 mb-2 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)]">
              {title}
            </CardTitle>

            {/* Filter tabs — All | High | VIP */}
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all duration-300",
                    activeTab === tab
                      ? "bg-[#00f2ff]/20 text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                      : "text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/5"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col relative z-10">
          <ScrollArea className="flex-1 min-h-0">
            <table className="w-full">
              <thead className="bg-[#0a0c10] shadow-[0_4px_15px_rgba(0,0,0,0.6)] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-[#00f2ff] opacity-80 w-28 border-b border-[#00f2ff]/20">
                    Escalation
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-[#00f2ff] opacity-80 w-24 border-b border-[#00f2ff]/20">
                    Priority ▼
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-[#00f2ff] opacity-80 border-b border-[#00f2ff]/20">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-[#00f2ff] opacity-80 border-b border-[#00f2ff]/20">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-[#00f2ff] opacity-80 border-b border-[#00f2ff]/20">
                    Task
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-[#00f2ff] opacity-80 border-b border-[#00f2ff]/20">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-[#00f2ff] opacity-80 border-b border-[#00f2ff]/20">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00f2ff]/10">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#5C6270] text-[10px] uppercase tracking-widest">
                      No active tasks
                    </td>
                  </tr>
                ) : (
                  filtered.map((task) => {
                    const esc = getEscalationInfo(task, now)
                    return (
                      <tr
                        key={task.id}
                        onClick={() => { setSelectedTaskId(task.id); setDetailModalOpen(true) }}
                        className="bg-[#00f2ff]/5 group-hover/main:bg-[#0a0c10] hover:!bg-[#00f2ff]/10 hover:!shadow-[inset_0_0_20px_rgba(0,242,255,0.15)] transition-all duration-300 cursor-pointer group"
                      >
                        {/* Escalation Time */}
                        <td className="px-4 py-3">
                          <div className={cn("font-mono text-[11px] font-bold tabular-nums tracking-wider", getEscalationColor(esc.level))}>
                            {esc.fmt}
                          </div>
                          <div className="text-[8px] uppercase tracking-widest text-[#5C6270] mt-0.5">{esc.label}</div>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", getPriorityDot(task.priority))} />
                            <span className="text-[10px] font-bold text-[#8E939D] uppercase tracking-widest">
                              {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                            </span>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] font-bold uppercase tracking-wider border-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]", getDeptColor(task.department?.code))}
                          >
                            {getDeptLabel(task.department?.code, task.department?.name)}
                          </Badge>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">
                            <MapPin className="h-3 w-3 text-[#5C6270] flex-shrink-0 group-hover:text-[#00f2ff] transition-colors" />
                            {task.location}
                          </div>
                        </td>

                        {/* Task */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#8E939D]">{task.title}</span>
                            {task.isVip && (
                              <Badge className="bg-amber-500/20 text-amber-400 text-[8px] uppercase tracking-widest border-0 px-1.5 shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                                VIP
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Assigned To */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-[#00f2ff]/20">
                              <AvatarFallback className="bg-[#0a0c10] text-[#00f2ff] text-[9px] font-bold">
                                {task.assignedTo
                                  ? `${task.assignedTo.firstName[0]}${task.assignedTo.lastName[0]}`
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] uppercase font-bold text-[#8E939D] tracking-wide">
                              {task.assignedTo
                                ? `${task.assignedTo.firstName} ${task.assignedTo.lastName[0]}.`
                                : "Unassigned"}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getStatusBadge(task.status))}
                          >
                            {getStatusLabel(task.status)}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onStatusUpdate={fetchData}
        onReassign={() => setDetailModalOpen(false)}
      />
    </>
  )
}
