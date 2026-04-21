"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Sparkles, BedDouble, CheckCircle2, Clock, AlertCircle,
  Users, RefreshCw, Search, Plus, X, Calendar, Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "DIRTY" | "CLEANING" | "MAINTENANCE" | "OUT_OF_ORDER"
type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED"
type Priority   = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

interface HKRoom {
  id: string
  room_number: string
  floor: number
  type: string
  status: RoomStatus
  housekeeping_tasks: {
    id: string
    status: TaskStatus
    priority: Priority
    task_type: string
    notes: string | null
    users: { id: string; first_name: string; last_name: string } | null
  }[]
  reservations: {
    guests: { first_name: string; last_name: string; is_vip: boolean } | null
  }[]
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  pending: number
  inProgress: number
  completed: number
}

// ── Status config — dot color only, cards stay unified cyan ──────────────────

const STATUS_DOT: Record<RoomStatus, string> = {
  AVAILABLE:    "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]",
  OCCUPIED:     "bg-blue-400    shadow-[0_0_8px_rgba(59,130,246,0.9)]",
  DIRTY:        "bg-amber-400   shadow-[0_0_8px_rgba(245,158,11,0.9)]",
  CLEANING:     "bg-purple-400  shadow-[0_0_8px_rgba(168,85,247,0.9)]",
  MAINTENANCE:  "bg-red-400     shadow-[0_0_8px_rgba(239,68,68,0.9)]",
  OUT_OF_ORDER: "bg-red-700     shadow-[0_0_8px_rgba(185,28,28,0.9)]",
}

const STATUS_TEXT: Record<RoomStatus, string> = {
  AVAILABLE:    "text-emerald-400",
  OCCUPIED:     "text-blue-400",
  DIRTY:        "text-amber-400",
  CLEANING:     "text-purple-400",
  MAINTENANCE:  "text-red-400",
  OUT_OF_ORDER: "text-red-300",
}

const STATUS_LABEL: Record<RoomStatus, string> = {
  AVAILABLE:    "Available",
  OCCUPIED:     "Occupied",
  DIRTY:        "Dirty",
  CLEANING:     "Cleaning",
  MAINTENANCE:  "Maintenance",
  OUT_OF_ORDER: "Out of Order",
}

// ── Priority badge — GM style ─────────────────────────────────────────────────

const getPriorityBadge = (priority: Priority) => {
  switch (priority) {
    case "URGENT": return <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-[8px] uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">URGENT</Badge>
    case "HIGH":   return <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[8px] uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">HIGH</Badge>
    case "MEDIUM": return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[8px] uppercase tracking-widest shadow-[0_0_10px_rgba(251,191,36,0.2)]">MEDIUM</Badge>
    case "LOW":    return <Badge className="bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30 text-[8px] uppercase tracking-widest shadow-[0_0_10px_rgba(0,242,255,0.2)]">LOW</Badge>
  }
}

export function HousekeepingContent() {
  const [activeTab, setActiveTab]           = useState("rooms")
  const [selectedFloor, setSelectedFloor]   = useState<number | "all">("all")
  const [searchQuery, setSearchQuery]       = useState("")
  const [rooms, setRooms]                   = useState<HKRoom[]>([])
  const [staff, setStaff]                   = useState<StaffMember[]>([])
  const [summary, setSummary]               = useState<Record<string, number>>({})
  const [isLoading, setIsLoading]           = useState(true)
  const [refreshing, setRefreshing]         = useState(false)

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [selectedRooms, setSelectedRooms]     = useState<string[]>([])
  const [selectedStaff, setSelectedStaff]     = useState("")
  const [taskPriority, setTaskPriority]       = useState<Priority>("MEDIUM")
  const [taskNotes, setTaskNotes]             = useState("")
  const [assigning, setAssigning]             = useState(false)

  const [selectedRoom, setSelectedRoom]       = useState<HKRoom | null>(null)
  const [isRoomDetailOpen, setIsRoomDetailOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus]   = useState(false)
  const [actionFeedback, setActionFeedback]   = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch("/api/housekeeping/rooms")
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setRooms(data.rooms ?? [])
      setStaff(data.staffWorkload ?? [])
      setSummary(data.summary ?? {})
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const floors = useMemo(() =>
    Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b),
    [rooms]
  )

  const filteredRooms = useMemo(() =>
    rooms.filter(r => {
      if (selectedFloor !== "all" && r.floor !== selectedFloor) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const guest = r.reservations[0]?.guests
        if (!r.room_number.includes(q) &&
            !guest?.first_name.toLowerCase().includes(q) &&
            !guest?.last_name.toLowerCase().includes(q)) return false
      }
      return true
    }),
    [rooms, selectedFloor, searchQuery]
  )

  const stats = useMemo(() => ({
    total:        summary.total        ?? rooms.length,
    available:    summary.available    ?? 0,
    occupied:     summary.occupied     ?? 0,
    dirty:        summary.dirty        ?? 0,
    cleaning:     summary.cleaning     ?? 0,
    maintenance:  (summary.maintenance ?? 0) + (summary.outOfOrder ?? 0),
    pendingTasks: summary.pendingTasks ?? 0,
  }), [summary, rooms.length])

  const handleUpdateRoomStatus = async (roomId: string, newStatus: string) => {
    setUpdatingStatus(true)
    setActionFeedback(null)
    try {
      const res = await fetch("/api/frontdesk/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed")
      setRooms(prev => prev.map(r =>
        r.id === roomId ? { ...r, status: newStatus as RoomStatus } : r
      ))
      if (selectedRoom?.id === roomId)
        setSelectedRoom(prev => prev ? { ...prev, status: newStatus as RoomStatus } : prev)
      setActionFeedback(`Room updated to ${STATUS_LABEL[newStatus as RoomStatus]}`)
    } catch {
      setActionFeedback("Failed to update room status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleAssignTasks = async () => {
    if (selectedRooms.length === 0 || !selectedStaff) return
    setAssigning(true)
    try {
      await Promise.all(selectedRooms.map(roomId =>
        fetch("/api/housekeeping/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            assignedToId: selectedStaff,
            taskType: "CLEANING",
            priority: taskPriority,
            notes: taskNotes || null,
          }),
        })
      ))
      setIsTaskModalOpen(false)
      setSelectedRooms([])
      setSelectedStaff("")
      setTaskNotes("")
      fetchData()
    } catch {
      alert("Failed to assign tasks")
    } finally {
      setAssigning(false)
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64 bg-[#00f2ff]/10" />
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-[#00f2ff]/10" />
          ))}
        </div>
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full bg-[#00f2ff]/10" />
          ))}
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">

      {/* ── Page header — exact GM overview style ── */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
          HOUSEKEEPING
          <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span>
          <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">{stats.total} ROOMS · {floors.length} FLOORS</span>
        </h1>
        <div className="flex items-center gap-2 bg-[#0a0c10] border border-[#00f2ff]/30 rounded-md p-1 shadow-[0_0_15px_rgba(0,242,255,0.05)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={refreshing}
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8"
          >
            <RefreshCw className={cn("h-3 w-3 mr-2 text-[#00f2ff]", refreshing && "animate-spin")} />
            {refreshing ? "SYNCING..." : "SYNC"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 h-8"
          >
            <Plus className="h-3 w-3 mr-2 text-[#00f2ff]" />
            ASSIGN TASKS
          </Button>
        </div>
      </div>

      {/* ── KPI bar — GM overview KPI card style ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "TOTAL ROOMS",   val: stats.total,        color: "text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]",         dot: "bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.8)]" },
          { label: "AVAILABLE",     val: stats.available,    color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]",       dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" },
          { label: "OCCUPIED",      val: stats.occupied,     color: "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]",          dot: "bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" },
          { label: "DIRTY",         val: stats.dirty,        color: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]",         dot: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" },
          { label: "CLEANING",      val: stats.cleaning,     color: "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]",       dot: "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" },
          { label: "MAINTENANCE",   val: stats.maintenance,  color: "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]",            dot: "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]" },
          { label: "PENDING TASKS", val: stats.pendingTasks, color: "text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]",        dot: "bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]" },
        ].map((kpi, i) => (
          <Card key={i} className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 relative z-10">
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#00f2ff]/70 transition-colors">{kpi.label}</p>
                <div className="flex items-center justify-between">
                  <p className={cn("text-2xl font-bold tracking-tight", kpi.color)}>{kpi.val}</p>
                  <span className={cn("h-2 w-2 rounded-full", kpi.dot)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs — styled like GM's inner section headers ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-[#0a0c10] border border-[#00f2ff]/20 p-1 gap-1">
            <TabsTrigger
              value="rooms"
              className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.15)] transition-all px-4 py-1.5"
            >
              ROOM GRID
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="text-[10px] font-bold uppercase tracking-widest text-[#5C6270] data-[state=active]:bg-[#00f2ff]/10 data-[state=active]:text-[#00f2ff] data-[state=active]:shadow-[0_0_10px_rgba(0,242,255,0.15)] transition-all px-4 py-1.5"
            >
              STAFF WORKLOAD
            </TabsTrigger>
          </TabsList>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* ── ROOMS TAB ── */}
        <TabsContent value="rooms" className="space-y-4 mt-0">

          {/* Floor + search filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-[#0a0c10] border border-[#00f2ff]/15 rounded-lg p-1">
              <button
                onClick={() => setSelectedFloor("all")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all",
                  selectedFloor === "all"
                    ? "bg-[#00f2ff] text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]"
                    : "text-[#5C6270] hover:text-[#00f2ff]"
                )}
              >ALL</button>
              {floors.map(floor => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all",
                    selectedFloor === floor
                      ? "bg-[#00f2ff] text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]"
                      : "text-[#5C6270] hover:text-[#00f2ff]"
                  )}
                >F{floor}</button>
              ))}
            </div>

            <div className="relative flex-1 max-w-sm group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C6270] group-focus-within/search:text-[#00f2ff] transition-colors" />
              <input
                type="text"
                placeholder="SEARCH ROOM OR GUEST..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-9 text-[10px] font-bold uppercase tracking-widest bg-[#00f2ff]/5 border border-[#00f2ff]/15 rounded-lg text-[#00f2ff] placeholder:text-[#5C6270] focus:outline-none focus:border-[#00f2ff]/50 focus:bg-[#0a0c10] transition-all"
              />
            </div>
          </div>

          {/* Room grid card */}
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center justify-between">
                <span>ROOM STATUS</span>
                <span className="text-[#5C6270] font-normal">
                  <span className="text-[#00f2ff]">{filteredRooms.length}</span> / {rooms.length} rooms
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 relative z-10">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {filteredRooms.map(room => {
                  const guest = room.reservations[0]?.guests
                  const task  = room.housekeeping_tasks[0]
                  const isVip = guest?.is_vip ?? false
                  return (
                    <div
                      key={room.id}
                      onClick={() => { setSelectedRoom(room); setIsRoomDetailOpen(true); setActionFeedback(null) }}
                      className="relative p-3 rounded-xl border border-[#00f2ff]/15 bg-[#0a0c10] cursor-pointer transition-all duration-300 group/room overflow-hidden shadow-[0_0_10px_rgba(0,242,255,0.03)] hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.15)]"
                    >
                      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/room:opacity-100 transition-opacity pointer-events-none" />
                      <div className="relative z-10">
                        {/* Room number + status dot */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.3)] group-hover/room:drop-shadow-[0_0_8px_rgba(0,242,255,0.5)] transition-all">
                            {room.room_number}
                          </span>
                          <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse flex-shrink-0", STATUS_DOT[room.status])} />
                        </div>
                        {/* Status label */}
                        <div className={cn("text-[8px] font-bold uppercase tracking-widest", STATUS_TEXT[room.status])}>
                          {STATUS_LABEL[room.status]}
                        </div>
                        {/* Task indicator */}
                        {task?.status === "PENDING" && (
                          <div className="mt-1.5 text-[8px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> PENDING
                          </div>
                        )}
                        {task?.status === "IN_PROGRESS" && (
                          <div className="mt-1.5 text-[8px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> ACTIVE
                          </div>
                        )}
                        {/* Staff initials */}
                        {task?.users && (
                          <div className="text-[8px] mt-1 truncate text-[#5C6270] group-hover/room:text-[#00f2ff]/60 transition-colors">
                            {task.users.first_name[0]}.{task.users.last_name[0]}.
                          </div>
                        )}
                      </div>
                      {/* VIP badge */}
                      {isVip && (
                        <div className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-yellow-500 flex items-center justify-center shadow-[0_0_8px_rgba(234,179,8,0.6)]">
                          <span className="text-[7px] text-black font-bold">V</span>
                        </div>
                      )}
                    </div>
                  )
                })}
                {filteredRooms.length === 0 && (
                  <div className="col-span-full text-center py-12 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">
                    NO ROOMS FOUND
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STAFF TAB ── */}
        <TabsContent value="staff" className="space-y-4 mt-0">
          <Card className="bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.03)] border-[#00f2ff]/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-3 border-b border-[#00f2ff]/10 relative z-10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.3)]" />
                STAFF WORKLOAD
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 relative z-10">
              {staff.length === 0 ? (
                <p className="text-center py-12 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">
                  NO STAFF DATA AVAILABLE
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staff.map(member => {
                    const total = member.pending + member.inProgress + (member.completed || 0)
                    const pct   = total > 0 ? Math.round((member.completed / total) * 100) : 0
                    const busy  = member.inProgress > 0

                    return (
                      <div
                        key={member.id}
                        className="p-4 rounded-xl border border-[#00f2ff]/15 bg-[#0a0c10] hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.12)] hover:bg-[#00f2ff]/5 transition-all duration-300 group/staff relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/staff:opacity-100 transition-opacity pointer-events-none" />
                        {/* Staff header */}
                        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#00f2ff]/10 relative z-10">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-[#00f2ff]/30">
                              <AvatarFallback className="bg-[#00f2ff]/10 text-[#00f2ff] text-[10px] font-bold">
                                {member.first_name[0]}{member.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] font-bold tracking-wide text-[#8E939D] group-hover/staff:text-[#00f2ff] transition-colors">
                              {member.first_name} {member.last_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-[8px] font-bold uppercase tracking-widest", busy ? "text-amber-400" : "text-emerald-400")}>
                              {busy ? "BUSY" : "NOMINAL"}
                            </span>
                            <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", busy
                              ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                              : "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                            )} />
                          </div>
                        </div>

                        {/* Task metric rows */}
                        <div className="space-y-1.5 relative z-10">
                          {[
                            { label: "PENDING",   val: member.pending,     color: "text-amber-400" },
                            { label: "IN PROGRESS", val: member.inProgress, color: "text-purple-400" },
                            { label: "COMPLETED",  val: member.completed,   color: "text-[#00f2ff]" },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 group-hover/staff:bg-[#0a0c10] group-hover/staff:border-[#00f2ff]/30 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                              <span className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270] group-hover/staff:text-[#00f2ff]/70 transition-colors">{row.label}</span>
                              <span className={cn("text-[11px] font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]", row.color)}>{row.val}</span>
                            </div>
                          ))}
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 pt-2.5 border-t border-[#00f2ff]/10 relative z-10">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">COMPLETION</span>
                            <span className="text-[10px] font-bold text-[#00f2ff]">{pct}%</span>
                          </div>
                          <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#00f2ff] rounded-full shadow-[0_0_6px_rgba(0,242,255,0.6)] transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Action buttons — GM overview action bar style ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button
          onClick={() => setIsTaskModalOpen(true)}
          className="bg-[#0a0c10] border border-[#00f2ff]/30 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/50 hover:shadow-[0_0_15px_rgba(0,242,255,0.3)] text-[#00f2ff] h-12 text-[10px] font-bold uppercase tracking-widest transition-all"
        >
          <Plus className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]" />
          ASSIGN TASKS
        </Button>
        <Button className="bg-[#0a0c10] border border-amber-400/30 hover:bg-amber-400/10 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] text-amber-400 h-12 text-[10px] font-bold uppercase tracking-widest transition-all">
          <AlertCircle className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" />
          MARK INSPECTION
        </Button>
        <Button className="bg-[#0a0c10] border border-purple-400/30 hover:bg-purple-400/10 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] text-purple-400 h-12 text-[10px] font-bold uppercase tracking-widest transition-all">
          <Sparkles className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]" />
          BULK CLEANING
        </Button>
        <Button className="bg-[#0a0c10] border border-emerald-400/30 hover:bg-emerald-400/10 hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-400 h-12 text-[10px] font-bold uppercase tracking-widest transition-all">
          <CheckCircle2 className="mr-2 h-4 w-4 drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]" />
          MARK ALL CLEAN
        </Button>
      </div>

      {/* ── Room Detail Modal ── */}
      <Dialog open={isRoomDetailOpen} onOpenChange={setIsRoomDetailOpen}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.15)] border-[#00f2ff]/30 text-[#8E939D] max-w-md rounded-xl">
          <DialogHeader className="border-b border-[#00f2ff]/10 pb-3">
            <DialogTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-[#00f2ff]" />
              ROOM {selectedRoom?.room_number}
              {selectedRoom?.reservations[0]?.guests?.is_vip && (
                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-[8px] uppercase tracking-widest shadow-[0_0_10px_rgba(234,179,8,0.2)]">VIP</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-4 py-2">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "STATUS", val: STATUS_LABEL[selectedRoom.status], color: STATUS_TEXT[selectedRoom.status] },
                  { label: "TYPE",   val: selectedRoom.type?.replace(/_/g, " "), color: "text-[#8E939D]" },
                  { label: "FLOOR",  val: `Floor ${selectedRoom.floor}`, color: "text-[#8E939D]" },
                  ...(selectedRoom.housekeeping_tasks[0]
                    ? [{ label: "TASK", val: selectedRoom.housekeeping_tasks[0].status.replace("_", " "), color: "text-[#8E939D]" }]
                    : []),
                ].map((row, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/30 hover:shadow-[0_0_10px_rgba(0,242,255,0.1)] transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270]">{row.label}</p>
                    <p className={cn("text-sm font-bold mt-1 capitalize drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]", row.color)}>{row.val}</p>
                  </div>
                ))}
              </div>

              {/* Guest */}
              {selectedRoom.reservations[0]?.guests && (
                <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/30 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                  <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270]">CURRENT GUEST</p>
                  <p className="text-sm font-bold mt-1 text-[#8E939D] hover:text-[#00f2ff] transition-colors">
                    {selectedRoom.reservations[0].guests.first_name} {selectedRoom.reservations[0].guests.last_name}
                  </p>
                </div>
              )}

              {/* Assigned staff */}
              {selectedRoom.housekeeping_tasks[0]?.users && (
                <div className="p-3 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/15 hover:border-[#00f2ff]/30 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                  <p className="text-[8px] uppercase tracking-widest font-bold text-[#5C6270]">ASSIGNED TO</p>
                  <p className="text-sm font-bold mt-1 text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]">
                    {selectedRoom.housekeeping_tasks[0].users.first_name} {selectedRoom.housekeeping_tasks[0].users.last_name}
                  </p>
                </div>
              )}

              {/* Feedback */}
              {actionFeedback && (
                <div className="px-3 py-2 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] text-[9px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                  {actionFeedback}
                </div>
              )}

              {/* Status workflow */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">UPDATE ROOM STATUS</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { status: "AVAILABLE",    label: "CLEAN / AVAILABLE", border: "border-emerald-400/30 hover:border-emerald-400/50 hover:bg-emerald-400/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-400" },
                    { status: "CLEANING",     label: "SEND TO CLEANING",  border: "border-purple-400/30 hover:border-purple-400/50 hover:bg-purple-400/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] text-purple-400" },
                    { status: "DIRTY",        label: "MARK DIRTY",        border: "border-amber-400/30 hover:border-amber-400/50 hover:bg-amber-400/10 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] text-amber-400" },
                    { status: "OCCUPIED",     label: "MARK OCCUPIED",     border: "border-blue-400/30 hover:border-blue-400/50 hover:bg-blue-400/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-400" },
                    { status: "MAINTENANCE",  label: "MAINTENANCE",       border: "border-red-400/30 hover:border-red-400/50 hover:bg-red-400/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] text-red-400" },
                    { status: "OUT_OF_ORDER", label: "OUT OF ORDER",      border: "border-[#5C6270]/30 hover:border-[#5C6270]/50 hover:bg-[#5C6270]/10 text-[#5C6270]" },
                  ] as { status: RoomStatus; label: string; border: string }[])
                    .filter(item => item.status !== selectedRoom.status)
                    .map(item => (
                      <Button
                        key={item.status}
                        size="sm"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateRoomStatus(selectedRoom.id, item.status)}
                        className={cn("bg-[#0a0c10] border text-[9px] font-bold uppercase tracking-widest h-9 transition-all", item.border)}
                      >
                        {updatingStatus ? "UPDATING..." : item.label}
                      </Button>
                    ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-[#0a0c10] border border-[#00f2ff]/20 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/50 hover:shadow-[0_0_15px_rgba(0,242,255,0.2)] text-[#00f2ff] text-[9px] font-bold uppercase tracking-widest transition-all"
                  onClick={() => setIsRoomDetailOpen(false)}
                >
                  CLOSE
                </Button>
                <Button
                  className="flex-1 bg-[#0a0c10] border border-emerald-400/30 hover:bg-emerald-400/10 hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-400 text-[9px] font-bold uppercase tracking-widest transition-all"
                  onClick={() => { setIsRoomDetailOpen(false); setSelectedRooms([selectedRoom.id]); setIsTaskModalOpen(true) }}
                >
                  ASSIGN TASK
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Assign Tasks Modal ── */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="bg-[#0a0c10] shadow-[0_0_30px_rgba(0,242,255,0.15)] border-[#00f2ff]/30 text-[#8E939D] max-w-2xl rounded-xl">
          <DialogHeader className="border-b border-[#00f2ff]/10 pb-3">
            <DialogTitle className="text-[10px] font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">
              ASSIGN HOUSEKEEPING TASKS
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4 max-h-[60vh] overflow-y-auto">
            {/* Room selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">SELECT ROOMS <span className="text-[#00f2ff]">({selectedRooms.length} selected)</span></p>
                <button
                  className="text-[9px] font-bold uppercase tracking-widest text-[#00f2ff] hover:text-[#00f2ff]/70 transition-colors"
                  onClick={() =>
                    setSelectedRooms(
                      selectedRooms.length === filteredRooms.length
                        ? []
                        : filteredRooms.map(r => r.id)
                    )
                  }
                >
                  {selectedRooms.length === filteredRooms.length ? "DESELECT ALL" : "SELECT ALL"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 border border-[#00f2ff]/15 rounded-lg bg-[#00f2ff]/5">
                {filteredRooms.map(room => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRooms(prev =>
                      prev.includes(room.id) ? prev.filter(id => id !== room.id) : [...prev, room.id]
                    )}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border shadow-[0_4px_10px_rgba(0,0,0,0.5)]",
                      selectedRooms.includes(room.id)
                        ? "bg-[#00f2ff]/10 border-[#00f2ff]/50 shadow-[0_0_10px_rgba(0,242,255,0.15)]"
                        : "bg-[#0a0c10] border-[#00f2ff]/15 hover:border-[#00f2ff]/30"
                    )}
                  >
                    <Checkbox checked={selectedRooms.includes(room.id)} className="border-[#00f2ff]/40" onCheckedChange={() => {}} />
                    <div>
                      <p className="text-[10px] font-bold text-[#00f2ff]">{room.room_number}</p>
                      <p className={cn("text-[8px] font-bold uppercase tracking-widest", STATUS_TEXT[room.status])}>{STATUS_LABEL[room.status]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">ASSIGN TO STAFF</p>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#8E939D] focus:border-[#00f2ff]/50 text-[10px] font-bold uppercase tracking-widest">
                  <SelectValue placeholder="SELECT STAFF MEMBER" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                  {staff.map(member => (
                    <SelectItem key={member.id} value={member.id} className="text-[#8E939D] text-[10px] font-bold uppercase tracking-widest">
                      {member.first_name} {member.last_name} — {member.pending} PENDING
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">PRIORITY</p>
              <Select value={taskPriority} onValueChange={(v: Priority) => setTaskPriority(v)}>
                <SelectTrigger className="bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#8E939D] focus:border-[#00f2ff]/50 text-[10px] font-bold uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0c10] border-[#00f2ff]/20">
                  {(["URGENT", "HIGH", "MEDIUM", "LOW"] as Priority[]).map(p => (
                    <SelectItem key={p} value={p} className="text-[#8E939D] text-[10px] font-bold uppercase tracking-widest">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">NOTES</p>
              <Textarea
                placeholder="SPECIAL INSTRUCTIONS..."
                value={taskNotes}
                onChange={e => setTaskNotes(e.target.value)}
                className="bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#8E939D] placeholder:text-[#5C6270] min-h-[80px] focus:bg-[#00f2ff]/10 focus:border-[#00f2ff]/40 focus:shadow-[0_0_10px_rgba(0,242,255,0.1)] text-[10px] font-bold uppercase tracking-widest"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#00f2ff]/10">
            <Button
              className="flex-1 bg-[#0a0c10] border border-[#00f2ff]/20 hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/50 hover:shadow-[0_0_15px_rgba(0,242,255,0.2)] text-[#00f2ff] text-[9px] font-bold uppercase tracking-widest h-11 transition-all"
              onClick={() => setIsTaskModalOpen(false)}
            >
              CANCEL
            </Button>
            <Button
              className="flex-1 bg-[#0a0c10] border border-emerald-400/30 hover:bg-emerald-400/10 hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-400 text-[9px] font-bold uppercase tracking-widest h-11 transition-all disabled:opacity-40"
              disabled={selectedRooms.length === 0 || !selectedStaff || assigning}
              onClick={handleAssignTasks}
            >
              {assigning ? "ASSIGNING..." : `ASSIGN TO ${selectedRooms.length} ROOM${selectedRooms.length !== 1 ? "S" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
