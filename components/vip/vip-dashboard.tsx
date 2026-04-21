"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useSmartInterval } from "@/hooks/use-smart-interval"
import { cn } from "@/lib/utils"
import {
  VIPGuest, VIPTier, GuestStatus,
  TIER_CONFIG, STATUS_CONFIG,
  REQUEST_STATUS_CONFIG, PRIORITY_CONFIG,
  VIP_GUESTS, getVIPSummary,
} from "@/lib/vip-data"
import {
  Star, Crown, User, Phone, MessageSquare,
  Clock, Plane, AlertTriangle,
  CheckCircle2, Loader2, BedDouble, Utensils,
  Car, Bell, Search, Heart, X,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  inHouse: number
  arriving: number
  departing: number
  upcoming: number
  pendingTasks: number
  urgentTasks: number
}

// ─── Summary KPI Bar ──────────────────────────────────────────────────────────

function SummaryBar({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  const s = summary ?? { inHouse: 0, arriving: 0, departing: 0, upcoming: 0, pendingTasks: 0, urgentTasks: 0 }
  const cards = [
    { label: "In House",        value: s.inHouse,      color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    { label: "Arriving Today",  value: s.arriving,     color: "text-[#00f2ff]",    bg: "bg-[#00f2ff]/10",    border: "border-[#00f2ff]/30", pulse: true },
    { label: "Departing Today", value: s.departing,    color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30" },
    { label: "Upcoming",        value: s.upcoming,     color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/30" },
    { label: "Pending Tasks",   value: s.pendingTasks, color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30" },
    { label: "Urgent",          value: s.urgentTasks,  color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30" },
  ]
  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div key={card.label} className={cn("rounded-xl border px-4 py-3 text-center hover:shadow-[0_0_15px_rgba(0,242,255,0.1)] transition-all", card.bg, card.border)}>
          <div className="flex items-center justify-center gap-1.5">
            {loading
              ? <div className="h-6 w-8 bg-slate-700 rounded animate-pulse" />
              : <p className={cn("text-2xl font-bold drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]", card.color)}>{card.value}</p>}
            {!loading && (card as any).pulse && card.value > 0 && (
              <div className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" />
            )}
          </div>
          <p className="text-[10px] text-[#5C6270] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)] mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier, size = "sm" }: { tier: VIPTier; size?: "sm" | "md" }) {
  const cfg = TIER_CONFIG[tier?.toLowerCase() as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.silver
  return (
    <div className={cn(
      "flex items-center gap-1 rounded-full border font-semibold",
      cfg.bg, cfg.border, cfg.color,
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
    )}>
      <Crown className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {cfg.label}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: GuestStatus }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? { bg: "bg-slate-800", border: "border-slate-700", color: "text-slate-400", dot: "bg-slate-400", label: status }
  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
      cfg.bg, cfg.border, cfg.color
    )}>
      <div className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </div>
  )
}

// ─── Guest Card ───────────────────────────────────────────────────────────────

function GuestCard({ guest, onClick, selected }: { guest: VIPGuest; onClick: () => void; selected: boolean }) {
  const pendingTasks = guest.tasks.filter((t) => t.status === "pending" || t.status === "escalated")
  const urgentTasks  = guest.tasks.filter((t) => t.priority === "urgent" && t.status !== "completed")
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all duration-200 group relative overflow-hidden",
        selected
          ? "bg-[#00f2ff]/10 border-[#00f2ff]/40 ring-1 ring-[#00f2ff]/30 hover:shadow-[0_0_20px_rgba(0,242,255,0.2)]"
          : "bg-[#0a0c10]/40 border-[#00f2ff]/20 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.1)]"
      )}
    >
      {!selected && <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />}
      <div className="flex items-start gap-3 relative z-10">
        <div className={cn(
          "h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
          guest.tier === "platinum" ? "bg-gradient-to-br from-slate-400 to-slate-600 text-[#8E939D]"
            : guest.tier === "gold" ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-900"
            : "bg-gradient-to-br from-slate-500 to-slate-700 text-[#8E939D]"
        )}>
          {guest.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#8E939D] truncate">{guest.name}</p>
            <TierBadge tier={guest.tier} />
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={guest.status} />
            <span className="text-[10px] text-[#8E939D]0">Room {guest.roomNumber}</span>
            <span className="text-[10px] text-[#8E939D]0">{guest.nationality}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
            <span>{guest.roomType}</span>
            <span>{guest.nights}n stay</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {urgentTasks.length > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/25">
                <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
                <span className="text-[9px] text-red-400 font-medium">{urgentTasks.length} urgent</span>
              </div>
            )}
            {pendingTasks.length > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/25">
                <Clock className="h-2.5 w-2.5 text-amber-400" />
                <span className="text-[9px] text-amber-400 font-medium">{pendingTasks.length} pending</span>
              </div>
            )}
            {guest.status === "arriving-today" && guest.flightNumber && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/25">
                <Plane className="h-2.5 w-2.5 text-blue-400" />
                <span className="text-[9px] text-blue-400 font-medium">{guest.flightNumber}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Task Item ────────────────────────────────────────────────────────────────

function TaskItem({ task, onStatusChange }: {
  task: import("@/lib/vip-data").ConciergeTask
  onStatusChange?: (taskId: string, status: string) => void
}) {
  const rCfg = REQUEST_STATUS_CONFIG[task.status?.toLowerCase() as keyof typeof REQUEST_STATUS_CONFIG] ?? { bg: 'bg-slate-500/15', color: 'text-slate-400', label: task.status }
  const pCfg = PRIORITY_CONFIG[task.priority?.toLowerCase() as keyof typeof PRIORITY_CONFIG] ?? { color: 'text-slate-400', label: task.priority }
  return (
    <div className={cn(
      "rounded-xl border p-3.5 space-y-2",
      task.status === "completed" ? "bg-slate-900/30 border-slate-800/40 opacity-70"
        : task.priority === "urgent" ? "bg-red-500/5 border-red-500/20"
        : "bg-slate-900/60 border-slate-800/60"
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-sm font-medium", task.status === "completed" ? "text-slate-400 line-through" : "text-[#8E939D]")}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn("text-[10px] font-semibold", pCfg.color)}>{pCfg.label}</span>
          <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", rCfg.bg, rCfg.color)}>
            {rCfg.label}
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400">{task.description}</p>
      <div className="flex items-center justify-between text-[10px] text-[#8E939D]0">
        <span>{task.department} · {task.assignedTo}</span>
        {task.dueBy && task.status !== "completed" && (
          <span className={cn("font-medium", task.priority?.toLowerCase() === "urgent" ? "text-red-400" : "text-amber-400")}>
            Due {new Date(task.dueBy).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        {task.completedAt && (
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        )}
      </div>
      {onStatusChange && task.status !== "completed" && (
        <div className="flex gap-2 pt-1">
          {task.status === "pending" && (
            <button
              onClick={() => onStatusChange(task.id, "in-progress")}
              className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium hover:bg-blue-500/20 transition-colors"
            >
              Start
            </button>
          )}
          <button
            onClick={() => onStatusChange(task.id, "completed")}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-colors"
          >
            Complete
          </button>
          {task.status !== "escalated" && (
            <button
              onClick={() => onStatusChange(task.id, "escalated")}
              className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-medium hover:bg-red-500/20 transition-colors"
            >
              Escalate
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Guest Detail Panel ───────────────────────────────────────────────────────

function GuestDetailPanel({ guest, onTaskStatusChange }: {
  guest: VIPGuest
  onTaskStatusChange: (taskId: string, status: string) => void
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "preferences" | "tasks" | "timeline">("overview")
  const tabs = [
    { id: "overview",    label: "Overview",    icon: User },
    { id: "preferences", label: "Preferences", icon: Heart },
    { id: "tasks",       label: "Tasks",       icon: Bell, badge: guest.tasks.filter((t) => t.status !== "completed").length },
    { id: "timeline",    label: "Timeline",    icon: Clock },
  ] as const
  const pendingTasks   = guest.tasks.filter((t) => t.status !== "completed")
  const completedTasks = guest.tasks.filter((t) => t.status === "completed")

  return (
    <div className="flex flex-col h-full rounded-2xl border border-[#00f2ff]/20 bg-[#0a0c10]/40 overflow-hidden hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all group relative">
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
      {/* Header */}
      <div className="p-5 border-b border-[#00f2ff]/20 bg-[#0a0c10]/80 relative z-10">
        <div className="flex items-start gap-4">
          <div className={cn(
            "h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg",
            guest.tier === "platinum" ? "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900"
              : guest.tier === "gold" ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-900"
              : "bg-gradient-to-br from-slate-400 to-slate-600 text-[#8E939D]"
          )}>
            {guest.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#8E939D]">{guest.name}</h2>
                <p className="text-xs text-slate-400">{guest.nationality} · {guest.language}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <TierBadge tier={guest.tier} size="md" />
                <StatusBadge status={guest.status} />
              </div>
            </div>
            {guest.status === 'no-reservation' ? (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                <p className="text-xs text-slate-400">No active reservation · <span className="text-slate-300">{guest.previousStays} previous stay{guest.previousStays !== 1 ? 's' : ''}</span> · Concierge: <span className="text-slate-300">{guest.assignedConcierge}</span></p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <div>
                  <p className="text-[10px] text-[#8E939D]0">Room</p>
                  <p className="text-sm font-semibold text-[#8E939D]">{guest.roomNumber}</p>
                  <p className="text-[10px] text-slate-400">{guest.roomType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8E939D]0">Stay</p>
                  <p className="text-sm font-semibold text-[#8E939D]">{guest.checkIn}</p>
                  <p className="text-[10px] text-slate-400">{guest.nights} nights → {guest.checkOut}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8E939D]0">Rate / Spend</p>
                  <p className="text-sm font-semibold text-emerald-400">${guest.rate.toLocaleString()}/n</p>
                  {guest.totalSpend > 0 && <p className="text-[10px] text-slate-400">Total ${guest.totalSpend.toLocaleString()}</p>}
                </div>
                <div>
                  <p className="text-[10px] text-[#8E939D]0">Concierge</p>
                  <p className="text-sm font-semibold text-[#8E939D]">{guest.assignedConcierge}</p>
                  <p className="text-[10px] text-slate-400">{guest.previousStays} prev. stays</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Quick actions */}
        <div className="flex items-center gap-2 mt-4 flex-wrap relative z-10">
          <button
            onClick={() => alert(`Calling Room ${guest.roomNumber}...`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 drop-shadow-[0_0_5px_rgba(16,185,129,0.15)]"
          >
            <Phone className="h-3.5 w-3.5" />Call Room
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff] hover:bg-[#00f2ff]/20 hover:border-[#00f2ff]/40 drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]"
          >
            <MessageSquare className="h-3.5 w-3.5" />Message
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/30 drop-shadow-[0_0_5px_rgba(245,158,11,0.15)]"
          >
            <Bell className="h-3.5 w-3.5" />Add Task
          </button>
          <button
            onClick={() => window.open(`/frontdesk?room=${guest.roomNumber}`, '_self')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/30 drop-shadow-[0_0_5px_rgba(147,51,234,0.15)]"
          >
            <BedDouble className="h-3.5 w-3.5" />View Room
          </button>
          {guest.transportRequired && (
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs drop-shadow-[0_0_5px_rgba(234,88,12,0.15)]">
              <Car className="h-3.5 w-3.5" />Transport Required
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5 pt-4 border-b border-[#00f2ff]/20 relative z-10">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all -mb-px",
                activeTab === tab.id ? "border-[#00f2ff] text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]" : "border-transparent text-slate-400 hover:text-[#00f2ff]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />{tab.label}
              {"badge" in tab && tab.badge > 0 && (
                <span className="h-4 w-4 rounded-full bg-[#00f2ff] text-[#0a0c10] text-[9px] font-bold flex items-center justify-center drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 relative z-10">

        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* VIP Note */}
            {guest.vipNote && (
              <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400/30 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-200/80 drop-shadow-[0_0_5px_rgba(234,179,8,0.15)]">{guest.vipNote}</p>
              </div>
            )}
            {/* Guest profile summary — always shown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#00f2ff]/20 bg-[#00f2ff]/5 p-3 hover:border-[#00f2ff]/40 hover:shadow-[0_0_10px_rgba(0,242,255,0.15)] transition-all group/card relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
                <p className="text-[10px] text-[#5C6270] uppercase tracking-wider mb-1 relative z-10 drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Loyalty Tier</p>
                <p className="text-sm font-semibold text-[#8E939D] capitalize relative z-10 drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{guest.tier}</p>
                <p className="text-[10px] text-[#5C6270] relative z-10 drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{guest.previousStays} previous stays</p>
              </div>
              <div className="rounded-xl border border-[#00f2ff]/20 bg-[#00f2ff]/5 p-3 hover:border-[#00f2ff]/40 hover:shadow-[0_0_10px_rgba(0,242,255,0.15)] transition-all group/card relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
                <p className="text-[10px] text-[#5C6270] uppercase tracking-wider mb-1 relative z-10 drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Nationality</p>
                <p className="text-sm font-semibold text-[#8E939D] relative z-10 drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{guest.nationality}</p>
                <p className="text-[10px] text-[#5C6270] relative z-10 drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Language: {guest.language}</p>
              </div>
              {guest.assignedConcierge && (
                <div className="rounded-xl border border-[#00f2ff]/20 bg-[#00f2ff]/5 p-3 hover:border-[#00f2ff]/40 hover:shadow-[0_0_10px_rgba(0,242,255,0.15)] transition-all group/card relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
                  <p className="text-[10px] text-[#5C6270] uppercase tracking-wider mb-1 relative z-10 drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Assigned Concierge</p>
                  <p className="text-sm font-semibold text-[#8E939D] relative z-10 drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{guest.assignedConcierge}</p>
                </div>
              )}
              {guest.transportRequired && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 hover:border-orange-500/40 hover:shadow-[0_0_10px_rgba(234,88,12,0.15)] transition-all group/card relative overflow-hidden">
                  <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
                  <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1 relative z-10 drop-shadow-[0_0_5px_rgba(234,88,12,0.15)]">Transport</p>
                  <p className="text-sm font-semibold text-orange-300 relative z-10">Required</p>
                </div>
              )}
            </div>
            {guest.flightNumber && (
              <div className="rounded-xl border border-[#00f2ff]/20 bg-[#00f2ff]/5 p-4 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.15)] transition-all group/flight relative overflow-hidden">
                <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover/flight:opacity-100 transition-opacity pointer-events-none" />
                <p className="text-xs font-semibold text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.3)] mb-2 flex items-center gap-1.5 relative z-10">
                  <Plane className="h-3.5 w-3.5" />Flight & Transfer
                </p>
                <div className="grid grid-cols-3 gap-3 text-xs relative z-10">
                  <div><p className="text-[#5C6270] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Flight</p><p className="font-semibold text-[#8E939D] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{guest.flightNumber}</p></div>
                  {guest.arrivalTime   && <div><p className="text-[#5C6270] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">ETA</p><p className="font-semibold text-[#8E939D] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{guest.arrivalTime}</p></div>}
                  {guest.departureTime && <div><p className="text-[#5C6270] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">Departure</p><p className="font-semibold text-[#8E939D] drop-shadow-[0_0_5px_rgba(0,242,255,0.1)]">{guest.departureTime}</p></div>}
                </div>
              </div>
            )}
            {guest.specialRequests.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E939D]0 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />Special Requests ({guest.specialRequests.length})
                </h4>
                <div className="space-y-1.5">
                  {guest.specialRequests.map((req, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-slate-300">{req}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {guest.dietaryRestrictions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E939D]0 mb-2">Dietary</h4>
                  <div className="space-y-1">
                    {guest.dietaryRestrictions.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                        <Utensils className="h-3 w-3 text-emerald-400" />
                        <span className="text-xs text-slate-300">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {guest.allergies.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E939D]0 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-400" />Allergies
                  </h4>
                  <div className="space-y-1">
                    {guest.allergies.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/5 border border-red-500/15">
                        <div className="h-2 w-2 rounded-full bg-red-400" />
                        <span className="text-xs text-slate-300">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="space-y-4">
            {guest.preferences.length === 0
              ? <p className="text-sm text-[#8E939D]0 text-center py-8">No preferences recorded</p>
              : guest.preferences.map((pref, i) => (
                  <div key={i}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E939D]0 mb-2">{pref.category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {pref.items.map((item, j) => (
                        <span key={j} className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">{item}</span>
                      ))}
                    </div>
                  </div>
                ))
            }
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-4">
            {pendingTasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E939D]0 mb-2">Active ({pendingTasks.length})</h4>
                <div className="space-y-2">
                  {pendingTasks.map((task) => <TaskItem key={task.id} task={task} onStatusChange={onTaskStatusChange} />)}
                </div>
              </div>
            )}
            {completedTasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E939D]0 mb-2">Completed ({completedTasks.length})</h4>
                <div className="space-y-2">
                  {completedTasks.map((task) => <TaskItem key={task.id} task={task} />)}
                </div>
              </div>
            )}
            {guest.tasks.length === 0 && <p className="text-sm text-[#8E939D]0 text-center py-8">No tasks for this guest</p>}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-1">
            {guest.timeline.length === 0
              ? <p className="text-sm text-[#8E939D]0 text-center py-8">No timeline events recorded</p>
              : guest.timeline.map((event, i) => {
                  const colors = {
                    arrival:   "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
                    service:   "bg-blue-500/20 border-blue-500/30 text-blue-400",
                    request:   "bg-amber-500/20 border-amber-500/30 text-amber-400",
                    departure: "bg-orange-500/20 border-orange-500/30 text-orange-400",
                    note:      "bg-slate-700/40 border-slate-600/30 text-slate-400",
                  }
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn("h-2.5 w-2.5 rounded-full border mt-1.5 flex-shrink-0", colors[event.type].split(" ").slice(0, 2).join(" "))} />
                        {i < guest.timeline.length - 1 && <div className="w-px flex-1 bg-slate-800 mt-1" />}
                      </div>
                      <div className={cn("flex-1 rounded-lg border px-3 py-2 mb-1", colors[event.type])}>
                        <p className="text-[10px] font-medium opacity-70">
                          {new Date(event.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-xs mt-0.5">{event.event}</p>
                      </div>
                    </div>
                  )
                })
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main VIP Dashboard ───────────────────────────────────────────────────────

export function VIPDashboard() {
  const [guests,        setGuests]        = useState<VIPGuest[]>([])
  const [summary,       setSummary]       = useState<Summary | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [selectedGuest, setSelectedGuest] = useState<VIPGuest | null>(null)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [statusFilter,  setStatusFilter]  = useState<GuestStatus | "all">("all")
  const [tierFilter,    setTierFilter]    = useState<VIPTier | "all">("all")
  const [search,        setSearch]        = useState("")

  const fetchGuests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Never send search to API — API only searches by name, not room number
      // Store ALL guests and filter entirely client-side
      const res = await fetch(`/api/vip/guests`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const guestList: VIPGuest[] = data.guests?.length > 0 ? data.guests : VIP_GUESTS
      const summaryData           = data.guests?.length > 0 ? data.summary : getVIPSummary()

      setGuests(guestList)
      setSummary(summaryData ?? null)
      if (guestList.length > 0) {
        setSelectedGuest((prev) => guestList.find((g) => g.id === prev?.id) ?? guestList[0])
      }
    } catch (e: any) {
      setGuests(VIP_GUESTS)
      setSummary(getVIPSummary())
      setSelectedGuest(VIP_GUESTS[0])
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

 // ✅ CORRECT - Hook called at top level
useEffect(() => {
  fetchGuests()
}, []) // Initial load only

useSmartInterval(() => fetchGuests(), 60000) // Auto-refresh every 60s

  // Search is handled client-side in the filtered memo — no API call needed

  // Optimistic task status update
  const handleTaskStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    const patch = (g: VIPGuest): VIPGuest => ({
      ...g,
      tasks: g.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus as any, completedAt: newStatus === "completed" ? new Date().toISOString() : t.completedAt }
          : t
      ),
    })
    setGuests((prev) => prev.map(patch))
    setSelectedGuest((prev) => (prev ? patch(prev) : prev))
    try {
      await fetch("/api/vip/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      })
    } catch { /* optimistic stays */ }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return guests.filter((g) => {
      if (statusFilter !== "all" && g.status !== statusFilter) return false
      if (tierFilter   !== "all" && g.tier   !== tierFilter)   return false
      if (q && !g.name.toLowerCase().includes(q) && !g.roomNumber.toLowerCase().includes(q)) return false
      return true
    })
  }, [guests, statusFilter, tierFilter, search])

  const sortOrder: Record<GuestStatus, number> = { "arriving-today": 0, "departing-today": 1, "in-house": 2, "upcoming": 3, "no-reservation": 4 }
  const sorted = [...filtered].sort((a, b) => sortOrder[a.status] - sortOrder[b.status])

  return (
    <div className="flex flex-col gap-4" style={{height: "100%"}}>
      <div className="flex-shrink-0"><SummaryBar summary={summary} loading={loading} /></div>


      <div>

        {/* Left: Guest list */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5C6270] group-focus-within:text-[#00f2ff] transition-colors drop-shadow-[0_0_5px_rgba(0,242,255,0.15)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guest or room..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-[#0a0c10]/50 border border-[#00f2ff]/20 rounded-lg text-[#8E939D] placeholder:text-[#5C6270] focus:bg-[#00f2ff]/10 focus:border-[#00f2ff]/40 focus:shadow-[0_0_15px_rgba(0,242,255,0.2)] focus:outline-none transition-all drop-shadow-[0_0_5px_rgba(0,242,255,0.05)]"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6270] hover:text-[#00f2ff] transition-colors drop-shadow-[0_0_5px_rgba(0,242,255,0.15)]">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "arriving-today", "in-house", "departing-today", "upcoming"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                    statusFilter === s
                      ? s === "all" ? "bg-slate-600/40 border-slate-500 text-[#8E939D]"
                        : `${STATUS_CONFIG[s]?.bg} ${STATUS_CONFIG[s]?.border} ${STATUS_CONFIG[s]?.color}`
                      : "bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                  )}
                >
                  {s === "all" ? "All" : STATUS_CONFIG[s]?.label}
                </button>
              ))}
              <div className="border-l border-slate-700 pl-1.5 flex gap-1.5">
                {(["all", "platinum", "gold", "silver"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTierFilter(t)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all capitalize",
                      tierFilter === t
                        ? t === "all" ? "bg-slate-600/40 border-slate-500 text-[#8E939D]"
                          : `${TIER_CONFIG[t]?.bg} ${TIER_CONFIG[t]?.border} ${TIER_CONFIG[t]?.color}`
                        : "bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    {t === "all" ? "All Tiers" : t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-y-auto space-y-2 pr-1" style={{height: "calc(100vh - 280px)"}}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-full bg-slate-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-700 rounded w-3/4" />
                        <div className="h-3 bg-slate-800 rounded w-1/2" />
                        <div className="h-3 bg-slate-800 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))
              : sorted.length === 0
              ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-[#8E939D]0">
                    <Crown className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No VIP guests match filters</p>
                  </div>
                )
              : sorted.map((guest) => (
                  <GuestCard
                    key={guest.id}
                    guest={guest}
                    onClick={() => { setSelectedGuest(guest); setModalOpen(true) }}
                    selected={selectedGuest?.id === guest.id}
                  />
                ))
            }
          </div>

          <p className="text-center text-[10px] text-[#8E939D]0">
            {loading ? "Loading..." : `${sorted.length} VIP guest${sorted.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Right: Detail panel — visible on large screens */}
      </div>

      {/* Guest detail modal */}
      {modalOpen && selectedGuest && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-3xl h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,242,255,0.2)] border border-[#00f2ff]/30">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 z-20 flex items-center justify-center h-8 w-8 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] hover:text-[#00f2ff] hover:bg-[#00f2ff]/20 transition-colors drop-shadow-[0_0_5px_rgba(0,242,255,0.3)]"
            >
              <X className="h-4 w-4" />
            </button>
            <GuestDetailPanel guest={selectedGuest} onTaskStatusChange={handleTaskStatusChange} />
          </div>
        </div>
      )}
    </div>
  )
}
