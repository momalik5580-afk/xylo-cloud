"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Room, STATUS_CONFIG, TYPE_CONFIG } from "@/lib/room-data"
import {
  X, Star, User, Calendar, Clock, Sparkles, Wrench,
  ChevronRight, Phone, MessageSquare, AlertTriangle,
  CheckCircle2, LogIn, LogOut, DollarSign, ClipboardList,
} from "lucide-react"

interface RoomDetailDrawerProps {
  room: Room | null
  onClose: () => void
}

export function RoomDetailDrawer({ room, onClose }: RoomDetailDrawerProps) {
  const [visible, setVisible] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const handleAction = async (label: string) => {
    if (!room) return
    setActionLoading(label)
    setFeedback(null)
    try {
      if (label === "Assign Housekeeping") {
        const res = await fetch("/api/frontdesk/rooms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_number: room.number, status: "CLEANING" }),
        })
        if (!res.ok) throw new Error("Failed")
        setFeedback({ msg: "Housekeeping assigned — room set to Cleaning", ok: true })
      } else if (label === "Mark for Inspection") {
        const res = await fetch("/api/frontdesk/rooms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_number: room.number, status: "AVAILABLE" }),
        })
        if (!res.ok) throw new Error("Failed")
        setFeedback({ msg: "Room marked as Available", ok: true })
      } else if (label === "Check In") {
        const res = await fetch("/api/frontdesk/rooms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_number: room.number, status: "OCCUPIED" }),
        })
        if (!res.ok) throw new Error("Failed")
        setFeedback({ msg: "Room checked in — status set to Occupied", ok: true })
      } else if (label === "Check Out") {
        const res = await fetch("/api/frontdesk/rooms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_number: room.number, status: "DIRTY" }),
        })
        if (!res.ok) throw new Error("Failed")
        setFeedback({ msg: "Checked out — room set to Dirty", ok: true })
      } else if (label === "Create Maintenance Task") {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Maintenance — Room ${room.number}`,
            description: `Maintenance task created for Room ${room.number} (Floor ${room.floor})`,
            priority: "HIGH",
            department: "Engineering",
          }),
        })
        if (!res.ok) throw new Error("Failed")
        setFeedback({ msg: "Maintenance task created", ok: true })
      } else if (label === "Add Task") {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Task — Room ${room.number}`,
            description: `Task for Room ${room.number}`,
            priority: "MEDIUM",
          }),
        })
        if (!res.ok) throw new Error("Failed")
        setFeedback({ msg: "Task added", ok: true })
      } else if (label === "Contact Guest" || label === "Send Message") {
        setFeedback({ msg: "Message feature coming soon", ok: true })
      }
    } catch {
      setFeedback({ msg: `Failed: ${label}`, ok: false })
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    if (room) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [room])

  if (!room) return null

  const statusCfg = STATUS_CONFIG[room.status]
  const typeCfg = TYPE_CONFIG[room.type]

  const quickActions = [
    {
      label: "Check In",
      icon: LogIn,
      color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
      show: room.status === "vacant" || room.status === "reserved",
    },
    {
      label: "Check Out",
      icon: LogOut,
      color: "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20",
      show: room.status === "occupied",
    },
    {
      label: "Assign Housekeeping",
      icon: Sparkles,
      color: "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20",
      show: room.status === "dirty" || room.status === "vacant",
    },
    {
      label: "Mark for Inspection",
      icon: CheckCircle2,
      color: "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20",
      show: room.status === "dirty",
    },
    {
      label: "Create Maintenance Task",
      icon: Wrench,
      color: "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20",
      show: room.status !== "maintenance",
    },
    {
      label: "Contact Guest",
      icon: Phone,
      color: "bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20",
      show: room.status === "occupied",
    },
    {
      label: "Send Message",
      icon: MessageSquare,
      color: "bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20",
      show: room.status === "occupied" || room.status === "reserved",
    },
    {
      label: "Add Task",
      icon: ClipboardList,
      color: "bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20",
      show: true,
    },
  ].filter((a) => a.show)

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-[420px] bg-[#0a0c10] border-l border-[#00f2ff]/20 z-50",
          "flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-[#00f2ff]/50 to-transparent opacity-30" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#00f2ff]/10 bg-[#00f2ff]/5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold tracking-[0.1em] text-[#8E939D] uppercase italic">
                  UNIT <span className="text-[#00f2ff]">{room.number}</span>
                </span>
                {room.isVIP && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#5C6270] mt-1">
                SYSTEM_NODE // LVL_{room.floor.toString().padStart(2, '0')} // {typeCfg.label.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#5C6270] hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 transition-all duration-300 border border-transparent hover:border-[#00f2ff]/30"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 p-3 rounded-lg group hover:border-[#00f2ff]/40 transition-all">
              <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">CURRENT_STATUS</p>
              <div className={cn("text-[10px] font-bold uppercase tracking-widest", statusCfg.color)}>
                {statusCfg.label}
              </div>
            </div>
            {room.rate && (
              <div className="bg-[#00f2ff]/5 border border-[#00f2ff]/15 p-3 rounded-lg group hover:border-[#00f2ff]/40 transition-all">
                <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] mb-1">BASE_RATE_24H</p>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                   ${room.rate.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Guest Info */}
          {room.guestName && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#00f2ff]/20 to-transparent" />
                <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#00f2ff]">ENTITY_DATA_RECORD</h4>
                <div className="h-[1px] w-6 bg-[#00f2ff]/20" />
              </div>
              
              <div className="rounded-xl border border-[#00f2ff]/20 bg-[#00f2ff]/5 p-5 space-y-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <User size={64} className="text-[#00f2ff]" />
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.1)]">
                    <User className="h-6 w-6 text-[#00f2ff]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{room.guestName.toUpperCase()}</p>
                    {room.isVIP && (
                      <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-500 flex items-center gap-1.5 mt-0.5">
                        <Star className="h-3 w-3 fill-yellow-500" />
                        PRIORITY ACCESS GUEST
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 relative z-10 border-t border-[#00f2ff]/15 pt-5">
                  {room.checkIn && (
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">CHECK_IN_TIMESTAMP</p>
                      <p className="text-[11px] font-mono font-bold text-[#8E939D]">{room.checkIn}</p>
                    </div>
                  )}
                  {room.checkOut && (
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">EXPECTED_RELEASE</p>
                      <p className="text-[11px] font-mono font-bold text-[#8E939D]">{room.checkOut}</p>
                    </div>
                  )}
                  {room.nights && (
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">RETENTION_PERIOD</p>
                      <p className="text-[11px] font-mono font-bold text-[#8E939D]">{room.nights} CYCLES</p>
                    </div>
                  )}
                  {room.nights && room.rate && (
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">TOTAL_VALUE_EST</p>
                      <p className="text-[11px] font-mono font-bold text-emerald-400">
                        ${(room.nights * room.rate).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Special Requests */}
          {room.specialRequests && room.specialRequests.length > 0 && (
            <div className="space-y-3">
               <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
                <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-500">REQUEST_LOGS</h4>
                <div className="h-[1px] w-6 bg-amber-500/20" />
              </div>
              <div className="space-y-2">
                {room.specialRequests.map((req, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="text-[11px] font-bold text-amber-200/90 uppercase tracking-tight">{req}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-4 pt-4">
             <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#00f2ff]/20 to-transparent" />
                <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#00f2ff]">COMMAND_OVERRIDE</h4>
                <div className="h-[1px] w-6 bg-[#00f2ff]/20" />
              </div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    disabled={actionLoading === action.label}
                    onClick={() => handleAction(action.label)}
                    className={cn(
                      "group relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-50 overflow-hidden",
                      "bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#8E939D]",
                      "hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/50 hover:text-[#00f2ff] hover:shadow-[0_0_15px_rgba(0,242,255,0.15)]"
                    )}
                  >
                    <div className="absolute top-0 right-0 p-1.5 opacity-0 group-hover:opacity-20 transition-opacity">
                       <Icon className="h-8 w-8" />
                    </div>
                    <Icon className={cn("h-5 w-5", actionLoading === action.label && "animate-spin")} />
                    <span className="relative z-10">{actionLoading === action.label ? "EXECUTING..." : action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}