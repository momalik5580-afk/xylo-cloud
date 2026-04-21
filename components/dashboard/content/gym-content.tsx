"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSmartInterval } from "@/hooks/use-smart-interval"
import { useRouter } from "next/navigation"
import {
  Heart, Flame, Wind, Droplets, Sun, Zap, Activity, Dumbbell,
  Search, Plus, X, ChevronRight, Loader2, RefreshCw,
  Wrench, AlertTriangle, CheckCircle2, Clock, Users, Calendar,
  MapPin, User, ChevronDown, ChevronUp, ArrowLeft, Crown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface GymClass {
  id: string
  name: string
  description: string | null
  instructor: string | null
  capacity: number
  duration: number
  scheduled_at: string
  location: string | null
  status: string
  current_count: number
  spotsLeft: number
  is_full: boolean
  bookings: ClassBooking[]
}

interface ClassBooking {
  id: string
  status: string
  booked_at: string
  guest?: { first_name: string; last_name: string; room_number?: string; is_vip?: boolean } | null
}

interface GymEquipment {
  id: string
  asset_tag: string | null
  name: string
  category: string
  brand: string | null
  model: string | null
  location: string | null
  status: string
  last_serviced_at: string | null
  next_service_at: string | null
  notes: string | null
}

interface GuestResult {
  id: string
  first_name: string
  last_name: string
  email: string | null
  room_number: string | null
  reservation_status: string | null
  is_vip?: boolean
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function classTypeFromName(name: string) {
  const l = name.toLowerCase()
  if (l.includes("yoga"))     return "yoga"
  if (l.includes("hiit"))     return "hiit"
  if (l.includes("pilates"))  return "pilates"
  if (l.includes("spin"))     return "spinning"
  if (l.includes("meditat"))  return "meditation"
  if (l.includes("strength")) return "strength"
  if (l.includes("aqua"))     return "aqua"
  if (l.includes("outdoor"))  return "outdoor"
  return "general"
}

const TYPE_ACCENT: Record<string, { border: string; text: string; bg: string; bar: string }> = {
  yoga:       { border: "border-violet-500/30", text: "text-violet-300",  bg: "bg-violet-500/8",  bar: "bg-violet-400" },
  hiit:       { border: "border-rose-500/30",   text: "text-rose-300",    bg: "bg-rose-500/8",    bar: "bg-rose-400"   },
  pilates:    { border: "border-pink-500/30",   text: "text-pink-300",    bg: "bg-pink-500/8",    bar: "bg-pink-400"   },
  spinning:   { border: "border-sky-500/30",    text: "text-sky-300",     bg: "bg-sky-500/8",     bar: "bg-sky-400"    },
  meditation: { border: "border-teal-500/30",   text: "text-teal-300",    bg: "bg-teal-500/8",    bar: "bg-teal-400"   },
  strength:   { border: "border-amber-500/30",  text: "text-amber-300",   bg: "bg-amber-500/8",   bar: "bg-amber-400"  },
  aqua:       { border: "border-cyan-500/30",   text: "text-cyan-300",    bg: "bg-cyan-500/8",    bar: "bg-cyan-400"   },
  outdoor:    { border: "border-lime-500/30",   text: "text-lime-300",    bg: "bg-lime-500/8",    bar: "bg-lime-400"   },
  general:    { border: "border-slate-500/30",  text: "text-[#8E939D]",   bg: "bg-slate-500/8",   bar: "bg-slate-500"  },
}

const TYPE_ICON: Record<string, React.ElementType> = {
  yoga: Heart, hiit: Flame, pilates: Activity, spinning: Zap,
  meditation: Wind, strength: Dumbbell, aqua: Droplets, outdoor: Sun, general: Activity,
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
}
function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
}
function fmtDateMini(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" })
}
function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}
function isTomorrow(iso: string) {
  const t = new Date(); t.setDate(t.getDate() + 1)
  return new Date(iso).toDateString() === t.toDateString()
}
function classDay(iso: string) {
  if (isToday(iso))    return "Today"
  if (isTomorrow(iso)) return "Tomorrow"
  return fmtDateShort(iso)
}

// ─────────────────────────────────────────────────────────────
// EQUIPMENT STATUS
// ─────────────────────────────────────────────────────────────

function equipStatus(eq: GymEquipment): "ok" | "service_due" | "maintenance" | "offline" {
  const s = eq.status.toLowerCase()
  if (s === "maintenance") return "maintenance"
  if (s === "offline" || s === "out_of_service") return "offline"
  if (eq.next_service_at && new Date(eq.next_service_at) < new Date()) return "service_due"
  return "ok"
}

const EQUIP_STATUS: Record<string, { label: string; dot: string; badge: string }> = {
  ok:          { label: "Operational",  dot: "bg-emerald-400", badge: "text-emerald-400 border-emerald-500/25 bg-emerald-500/8" },
  service_due: { label: "Service Due",  dot: "bg-amber-400",   badge: "text-amber-400 border-amber-500/30 bg-amber-500/8" },
  maintenance: { label: "Maintenance",  dot: "bg-rose-400",    badge: "text-rose-400 border-rose-500/25 bg-rose-500/8" },
  offline:     { label: "Out of Service",dot: "bg-slate-500",  badge: "text-[#5C6270] border-slate-600/30 bg-slate-700/20" },
}

// ─────────────────────────────────────────────────────────────
// GUEST SEARCH
// ─────────────────────────────────────────────────────────────

function useGuestSearch() {
  const [query,   setQuery]   = useState("")
  const [results, setResults] = useState<GuestResult[]>([])
  const [loading, setLoading] = useState(false)
  const search = useCallback(async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/gym/guests?search=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.guests ?? [])
    } catch { setResults([]) } finally { setLoading(false) }
  }, [])
  return { query, results, loading, search, setQuery, setResults }
}

// ─────────────────────────────────────────────────────────────
// REGISTRATION DIALOG
// ─────────────────────────────────────────────────────────────

function RegisterDialog({ gymClass, onClose, onDone }: {
  gymClass: GymClass | null
  onClose: () => void
  onDone:  () => void
}) {
  const [selected,   setSelected]   = useState<GuestResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const gs = useGuestSearch()

  useEffect(() => {
    if (gymClass) {
      setSelected(null); setDone(false); setError(null)
      gs.setQuery(""); gs.setResults([])
    }
  }, [gymClass?.id])

  async function handleRegister() {
    if (!gymClass || !selected) return
    setSubmitting(true); setError(null)
    try {
      const res  = await fetch("/api/gym/classes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "book", classId: gymClass.id, guestId: selected.id }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Could not register guest"); return }
      setDone(true)
      onDone()
    } catch { setError("Network error — please try again") }
    finally { setSubmitting(false) }
  }

  if (!gymClass) return null

  const type     = classTypeFromName(gymClass.name)
  const acc      = TYPE_ACCENT[type]
  const fill     = gymClass.capacity ? Math.round((gymClass.current_count / gymClass.capacity) * 100) : 0
  const roomNo = selected?.room_number ?? null

  return (
    <DialogContent className="bg-[#0a0c10] border border-[#00f2ff]/30 text-[#8E939D] max-w-sm shadow-2xl p-0 overflow-hidden">
      <div className={cn("h-0.5 w-full", acc.bar)} />

      <div className="p-6 space-y-4">
        {!done ? (
          <>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#5C6270] mb-1">REGISTER HOTEL GUEST</p>
              <h2 className="text-lg font-semibold text-[#8E939D]">{gymClass.name}</h2>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-[#5C6270]">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-[#00f2ff]" />{fmtDate(gymClass.scheduled_at)} · {fmtTime(gymClass.scheduled_at)}</span>
                <span className="flex items-center gap-1"><User className="h-3 w-3 text-[#00f2ff]" />{gymClass.instructor ?? "TBA"}</span>
                {gymClass.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#00f2ff]" />{gymClass.location}</span>}
              </div>
            </div>

            <div className="h-px bg-[#00f2ff]/20" />

            {!selected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-[#8E939D]">Search for guest</p>
                  <p className="text-xs text-[#5C6270] mt-0.5">Type name or room number to find the guest</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C6270]" />
                  <Input
                    placeholder="e.g. Al-Rashidi or 412"
                    value={gs.query}
                    onChange={e => gs.search(e.target.value)}
                    autoFocus
                    className="pl-10 bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#8E939D] placeholder:text-[#5C6270] h-10 text-sm"
                  />
                </div>

                {gs.loading && (
                  <p className="flex items-center gap-2 text-xs text-[#5C6270] px-1">
                    <Loader2 className="h-3 w-3 animate-spin text-[#00f2ff]" />SEARCHING...
                  </p>
                )}

                {gs.results.length > 0 && (
                  <div className="rounded-xl border border-[#00f2ff]/20 overflow-hidden divide-y divide-[#00f2ff]/10">
                    {gs.results.map(g => (
                      <button key={g.id}
                        onClick={() => { setSelected(g); gs.setQuery(""); gs.setResults([]) }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#00f2ff]/10 text-left transition-colors group">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="bg-[#00f2ff]/10 text-[#8E939D] text-xs font-bold border border-[#00f2ff]/30">
                            {g.first_name[0]}{g.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{g.first_name} {g.last_name}</p>
                          <p className={cn("text-xs mt-0.5", g.room_number ? "text-amber-400" : "text-[#5C6270]")}>
                            {g.room_number ? `ROOM ${g.room_number}` : "No active reservation"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#5C6270] group-hover:text-[#00f2ff] flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {gs.query.length >= 2 && !gs.loading && gs.results.length === 0 && (
                  <p className="text-xs text-[#5C6270] text-center py-2">No guests found for "{gs.query}"</p>
                )}

                <Button variant="outline" className="w-full border-[#00f2ff]/30 bg-transparent text-[#5C6270] hover:text-slate-300 h-9 text-sm"
                  onClick={onClose}>
                  CANCEL
                </Button>
              </div>

            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-[#00f2ff]/10 text-[#8E939D] text-sm font-bold border border-[#00f2ff]/30">
                        {selected.first_name[0]}{selected.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-[#8E939D]">{selected.first_name} {selected.last_name}</p>
                      <p className={cn("text-sm font-medium mt-0.5", roomNo ? "text-amber-400" : "text-[#5C6270]")}>
                        {roomNo ? `ROOM ${roomNo}` : "No room assigned"}
                      </p>
                    </div>
                    <button onClick={() => setSelected(null)}
                      className="text-[#5C6270] hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-[#00f2ff]/10">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="border-t border-amber-500/20 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <span className="text-[#5C6270]">DATE</span>
                    <span className="text-[#8E939D] font-medium">{fmtDate(gymClass.scheduled_at)}</span>
                    <span className="text-[#5C6270]">TIME</span>
                    <span className="text-[#8E939D] font-medium">{fmtTime(gymClass.scheduled_at)}</span>
                    <span className="text-[#5C6270]">DURATION</span>
                    <span className="text-[#8E939D]">{gymClass.duration} MIN</span>
                    {gymClass.location && <>
                      <span className="text-[#5C6270]">STUDIO</span>
                      <span className="text-[#8E939D]">{gymClass.location}</span>
                    </>}
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-rose-400 bg-rose-500/8 border border-rose-500/30 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline"
                    className="border-[#00f2ff]/30 bg-transparent text-[#5C6270] hover:text-slate-300 h-10 px-4"
                    onClick={() => setSelected(null)}>
                    BACK
                  </Button>
                  <Button
                    className="flex-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 h-10 font-semibold border border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                    disabled={submitting || gymClass.is_full}
                    onClick={handleRegister}>
                    {submitting
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />REGISTERING...</>
                      : gymClass.is_full ? "FULLY RESERVED" : "✓ CONFIRM REGISTRATION"
                    }
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#8E939D]">{selected?.first_name} {selected?.last_name}</p>
              {roomNo && <p className="text-sm text-amber-400 font-medium mt-0.5">ROOM {roomNo}</p>}
              <p className="text-sm text-[#5C6270] mt-3">Registered for <span className="text-[#8E939D] font-medium">{gymClass.name}</span></p>
              <p className="text-xs text-[#5C6270] mt-1">{fmtDate(gymClass.scheduled_at)} · {fmtTime(gymClass.scheduled_at)}</p>
            </div>
            <Button className="w-full bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#8E939D] h-10 border border-[#00f2ff]/30" onClick={onClose}>
              DONE
            </Button>
          </div>
        )}
      </div>
    </DialogContent>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function GymContent() {
  const router = useRouter()
  const [classes,      setClasses]      = useState<GymClass[]>([])
  const [equipment,    setEquipment]    = useState<GymEquipment[]>([])
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [justRefreshed,setJustRefreshed]= useState(false)
  const [registerFor,  setRegisterFor]  = useState<GymClass | null>(null)
  const [expandedClass,setExpandedClass]= useState<string | null>(null)
  const [equipFilter,  setEquipFilter]  = useState<"all" | "issues">("all")

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true)
    try {
      const res  = await fetch("/api/gym/classes")
      const json = await res.json()
      if (json.classes)   setClasses(json.classes)
      if (json.equipment) setEquipment(json.equipment)
      if (refresh) { setJustRefreshed(true); setTimeout(() => setJustRefreshed(false), 1500) }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }

  // Initial load
useEffect(() => {
  load()
}, [])

// Auto-refresh every 60 seconds (called at TOP LEVEL, not inside useEffect)
useSmartInterval(() => load(true), 60000)

  const [cancellingId,  setCancellingId]  = useState<string | null>(null)
  const [updatingEquip, setUpdatingEquip] = useState<string | null>(null)

  async function cancelBooking(bookingId: string) {
    setCancellingId(bookingId)
    try {
      await fetch("/api/gym/classes", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingId, status: "CANCELLED" }),
      })
      await load(true)
    } catch (e) { console.error(e) }
    finally { setCancellingId(null) }
  }

  async function updateEquipStatus(equipmentId: string, status: string) {
    setUpdatingEquip(equipmentId)
    try {
      await fetch("/api/gym/classes", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ equipmentId, status }),
      })
      await load(true)
    } catch (e) { console.error(e) }
    finally { setUpdatingEquip(null) }
  }

  const classesByDay = useMemo(() => {
    const groups: { label: string; date: string; classes: GymClass[] }[] = []
    const seen = new Set<string>()
    classes.forEach(c => {
      const d = new Date(c.scheduled_at).toDateString()
      if (!seen.has(d)) {
        seen.add(d)
        groups.push({ label: classDay(c.scheduled_at), date: d, classes: [] })
      }
      groups.find(g => g.date === d)!.classes.push(c)
    })
    return groups
  }, [classes])

  const equipToShow = useMemo(() =>
    equipFilter === "issues"
      ? equipment.filter(e => equipStatus(e) !== "ok")
      : equipment,
  [equipment, equipFilter])

  const [seeding, setSeeding] = useState(false)

  async function seedClasses() {
    setSeeding(true)
    try {
      await fetch("/api/gym/seed", { method: "POST" })
      await load(true)
    } catch (e) { console.error(e) }
    finally { setSeeding(false) }
  }

  const issueCount    = equipment.filter(e => equipStatus(e) !== "ok").length
  const todayClasses  = classes.filter(c => isToday(c.scheduled_at))
  const nextClass     = classes.find(c => new Date(c.scheduled_at) > new Date() && c.status === "SCHEDULED")

  if (loading) return (
    <div className="p-6 space-y-5">
      <Skeleton className="h-8 w-56 bg-[#00f2ff]/5 border border-[#00f2ff]/10" />
      <div className="grid grid-cols-2 gap-5">
        <Skeleton className="h-[600px] bg-[#00f2ff]/5 border border-[#00f2ff]/10 rounded-2xl" />
        <Skeleton className="h-[600px] bg-[#00f2ff]/5 border border-[#00f2ff]/10 rounded-2xl" />
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-5">

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-[#5C6270] hover:text-[#8E939D] transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">DASHBOARD</span>
          </button>
          <div className="h-4 w-px bg-[#00f2ff]/30" />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.25)] flex items-center gap-3">
              <Dumbbell className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]" />
              FITNESS CENTRE <span className="text-[#5C6270] text-xs font-normal tracking-[0.3em]">///</span> GYM MANAGEMENT
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] mt-1 ml-1">
              {todayClasses.length} {todayClasses.length === 1 ? "CLASS" : "CLASSES"} TODAY
              {nextClass && <>&ensp;·&ensp;NEXT: <span className="text-[#00f2ff]">{nextClass.name}</span> AT {fmtTime(nextClass.scheduled_at)}</>}
            </p>
          </div>
        </div>

        <button onClick={() => load(true)} disabled={refreshing}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all",
            justRefreshed
              ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.2)]"
              : "border-[#00f2ff]/30 bg-transparent text-[#5C6270] hover:text-[#8E939D] hover:border-[#00f2ff]/50 hover:bg-[#00f2ff]/5",
            refreshing && "opacity-50 cursor-not-allowed"
          )}>
          {refreshing
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />SYNCING...</>
            : justRefreshed
            ? <><CheckCircle2 className="h-3.5 w-3.5" />UPDATED</>
            : <><RefreshCw className="h-3.5 w-3.5" />SYNC</>
          }
        </button>
      </div>

      {/* MAIN TWO-PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">

        {/* LEFT: CLASS SCHEDULE */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#5C6270] font-bold">GROUP CLASS SCHEDULE</p>
            <div className="h-px flex-1 bg-[#00f2ff]/20" />
            <span className="text-[10px] text-[#5C6270] font-bold">{classes.length} UPCOMING</span>
          </div>

          {classes.length === 0 ? (
            <div className="flex flex-col items-center py-20 rounded-2xl border border-[#00f2ff]/30 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.05)] gap-4">
              <Calendar className="h-8 w-8 text-[#5C6270]" />
              <div className="text-center">
                <p className="text-[#8E939D] text-sm font-bold uppercase tracking-widest">No classes scheduled yet</p>
                <p className="text-[#5C6270] text-xs mt-1">Seed sample classes to get started</p>
              </div>
              <Button size="sm" onClick={seedClasses} disabled={seeding}
                className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 h-8 text-xs font-bold uppercase tracking-widest border border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                {seeding ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />CREATING CLASSES...</> : "CREATE SAMPLE SCHEDULE"}
              </Button>
            </div>
          ) : classesByDay.map(({ label, classes: dayClasses }) => (
            <div key={label} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <p className={cn("text-xs font-bold uppercase tracking-widest", label === "Today" ? "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]" : "text-[#5C6270]")}>
                  {label}
                </p>
                <div className="h-px flex-1 bg-[#00f2ff]/20" />
              </div>

              {dayClasses.map(cls => {
                const type      = classTypeFromName(cls.name)
                const acc       = TYPE_ACCENT[type]
                const Icon      = TYPE_ICON[type] ?? Activity
                const fill      = cls.capacity ? Math.round((cls.current_count / cls.capacity) * 100) : 0
                const canBook   = !cls.is_full && cls.status === "SCHEDULED"
                const isExpanded = expandedClass === cls.id
                const isLive    = cls.status === "IN_PROGRESS"
                const isPast    = cls.status === "COMPLETED"

                return (
                  <div key={cls.id}
                    className={cn(
                      "rounded-xl border transition-all overflow-hidden group relative",
                      isLive  ? "border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_15px_rgba(52,211,153,0.1)]" :
                      isPast  ? "border-[#00f2ff]/20 bg-[#0a0c10] opacity-60" :
                                "border-[#00f2ff]/20 bg-[#0a0c10] hover:border-[#00f2ff]/40 hover:shadow-[0_0_20px_rgba(0,242,255,0.1)]"
                    )}>
                    <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    {!isPast && <div className={cn("h-0.5 w-full", acc.bar)} />}

                    <div className="p-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg border flex-shrink-0", acc.border, acc.bg)}>
                          <Icon className={cn("h-4 w-4", acc.text)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold uppercase tracking-widest text-[#8E939D] group-hover:text-[#00f2ff] transition-colors">{cls.name}</p>
                            {isLive && (
                              <span className="flex items-center gap-1 text-[9px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-[#00f2ff]" />{fmtTime(cls.scheduled_at)}</span>
                            <span>{cls.duration} MIN</span>
                            {cls.instructor && <span className="flex items-center gap-1"><User className="h-3 w-3 text-[#00f2ff]" />{cls.instructor}</span>}
                            {cls.location && <span className="flex items-center gap-1 hidden sm:flex"><MapPin className="h-3 w-3 text-[#00f2ff]" />{cls.location}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className={cn("text-sm font-bold tabular-nums",
                              cls.is_full ? "text-rose-400" :
                              cls.spotsLeft <= 2 ? "text-amber-400" : "text-[#8E939D]")}>
                              {cls.current_count}<span className="text-[#5C6270] font-normal">/{cls.capacity}</span>
                            </p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">
                              {cls.is_full ? "FULL" : `${cls.spotsLeft} LEFT`}
                            </p>
                          </div>

                          {!isPast && (
                            <Button size="sm"
                              disabled={!canBook}
                              onClick={() => setRegisterFor(cls)}
                              className={cn(
                                "h-8 px-3 text-[9px] font-bold uppercase tracking-widest",
                                canBook
                                  ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
                                  : "bg-[#00f2ff]/5 border border-[#00f2ff]/20 text-[#5C6270] cursor-not-allowed"
                              )}>
                              {cls.is_full ? "FULL" : "REGISTER"}
                            </Button>
                          )}

                          <button
                            onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                            className="text-[#5C6270] hover:text-[#00f2ff] transition-colors p-1">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 h-0.5 bg-[#00f2ff]/20 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", acc.bar)} style={{ width: `${fill}%` }} />
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[#00f2ff]/20 space-y-2">
                          {cls.description && (
                            <p className="text-[9px] text-[#5C6270] leading-relaxed font-bold uppercase tracking-widest">{cls.description}</p>
                          )}
                          <p className="text-[8px] uppercase tracking-wider text-[#5C6270] font-bold">
                            REGISTERED ({cls.bookings.filter(b => b.status !== "CANCELLED").length})
                          </p>
                          {cls.bookings.filter(b => b.status !== "CANCELLED").length === 0 ? (
                            <p className="text-[9px] text-[#5C6270] italic py-1">No guests registered</p>
                          ) : (
                            <div className="space-y-1">
                              {cls.bookings.filter(b => b.status !== "CANCELLED").map((b, i) => (
                                <div key={b.id ?? i}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#00f2ff]/5 border border-[#00f2ff]/20 group-hover:border-[#00f2ff]/30 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {b.guest?.is_vip && <Crown className="h-3 w-3 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]" />}
                                      <p className="text-[9px] font-bold text-[#8E939D] truncate uppercase tracking-widest">
                                        {b.guest ? `${b.guest.first_name} ${b.guest.last_name}` : `GUEST ${i + 1}`}
                                      </p>
                                    </div>
                                    {b.guest?.room_number && (
                                      <p className="text-[8px] text-amber-400/70 mt-0.5 font-bold uppercase tracking-widest">ROOM {b.guest.room_number}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => b.id && cancelBooking(b.id)}
                                    disabled={cancellingId === b.id}
                                    title="Remove registration"
                                    className="opacity-0 group-hover:opacity-100 text-[#5C6270] hover:text-rose-400 transition-all p-1 rounded flex-shrink-0">
                                    {cancellingId === b.id
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <X className="h-3 w-3" />
                                    }
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* RIGHT: EQUIPMENT STATUS */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#5C6270] font-bold">EQUIPMENT</p>
              {issueCount > 0 && (
                <span className="text-[9px] text-rose-400 border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest flex items-center gap-1 shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                  <AlertTriangle className="h-2.5 w-2.5" />{issueCount} ISSUE{issueCount !== 1 ? "S" : ""}
                </span>
              )}
            </div>
            <div className="flex gap-1 p-0.5 bg-[#00f2ff]/5 rounded-lg border border-[#00f2ff]/20">
              <button onClick={() => setEquipFilter("all")}
                className={cn("px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all",
                  equipFilter === "all" ? "bg-[#00f2ff]/20 text-[#00f2ff] shadow-[0_0_5px_rgba(0,242,255,0.2)]" : "text-[#5C6270] hover:text-[#8E939D]")}>
                ALL
              </button>
              <button onClick={() => setEquipFilter("issues")}
                className={cn("px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all",
                  equipFilter === "issues" ? "bg-rose-500/20 text-rose-400 shadow-[0_0_5px_rgba(239,68,68,0.2)]" : "text-[#5C6270] hover:text-rose-400",
                  issueCount > 0 && equipFilter !== "issues" && "text-rose-400/70")}>
                ISSUES {issueCount > 0 && `(${issueCount})`}
              </button>
            </div>
          </div>

          {equipToShow.length === 0 ? (
            <div className="flex flex-col items-center py-12 rounded-2xl border border-[#00f2ff]/30 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.05)]">
              {equipFilter === "issues"
                ? <><CheckCircle2 className="h-7 w-7 text-emerald-500/50 mb-2" /><p className="text-[#5C6270] text-sm font-bold uppercase tracking-widest">ALL EQUIPMENT OPERATIONAL</p></>
                : <><Dumbbell className="h-7 w-7 text-[#5C6270] mb-2" /><p className="text-[#5C6270] text-sm font-bold uppercase tracking-widest">NO EQUIPMENT RECORDS FOUND</p></>
              }
            </div>
          ) : (
            <div className="space-y-2">
              {equipToShow.map(eq => {
                const st      = equipStatus(eq)
                const style   = EQUIP_STATUS[st]
                const busy    = updatingEquip === eq.id
                const rawStatus = eq.status.toLowerCase()

                return (
                  <div key={eq.id} className={cn(
                    "rounded-xl border border-[#00f2ff]/20 bg-[#0a0c10] px-3.5 py-3 space-y-2.5 hover:border-[#00f2ff]/40 hover:shadow-[0_0_15px_rgba(0,242,255,0.05)] transition-all group relative overflow-hidden"
                  )}>
                    <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={cn("h-2 w-2 rounded-full flex-shrink-0", style.dot,
                        st === "service_due" && "animate-pulse")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold uppercase tracking-widest text-[#8E939D] group-hover:text-[#00f2ff] transition-colors truncate">{eq.name}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270] truncate">
                          {[eq.brand, eq.location].filter(Boolean).join(" · ") || eq.category}
                        </p>
                      </div>
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00f2ff] flex-shrink-0" />}
                    </div>

                    <div className="flex gap-1.5 relative z-10">
                      {[
                        { value: "operational", label: "OPERATIONAL", active: "bg-emerald-600/20 text-emerald-400 border-emerald-500/40", inactive: "text-[#5C6270] border-[#00f2ff]/20 hover:border-emerald-500/40 hover:text-emerald-400" },
                        { value: "maintenance", label: "MAINTENANCE", active: "bg-rose-600/20 text-rose-400 border-rose-500/40", inactive: "text-[#5C6270] border-[#00f2ff]/20 hover:border-rose-500/40 hover:text-rose-400" },
                        { value: "offline",     label: "OUT OF SERVICE", active: "bg-slate-600/20 text-slate-300 border-slate-500/40", inactive: "text-[#5C6270] border-[#00f2ff]/20 hover:border-slate-500/40 hover:text-slate-300" },
                      ].map(opt => {
                        const isActive = rawStatus === opt.value ||
                          (opt.value === "operational" && rawStatus === "operational") ||
                          (opt.value === "offline" && (rawStatus === "offline" || rawStatus === "out_of_service"))
                        return (
                          <button key={opt.value}
                            disabled={busy || isActive}
                            onClick={() => updateEquipStatus(eq.id, opt.value)}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-widest transition-all",
                              isActive ? opt.active : opt.inactive,
                              busy && "opacity-40 cursor-not-allowed"
                            )}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>

                    {(st === "service_due" || st === "maintenance") && (
                      <p className="text-[8px] font-bold uppercase tracking-widest text-amber-400/70 pl-5 relative z-10">
                        {st === "service_due" && eq.next_service_at
                          ? `SERVICE WAS DUE ${fmtDateMini(eq.next_service_at)}`
                          : eq.notes ?? "UNDER MAINTENANCE"}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {equipment.length > 0 && (
            <div className="flex gap-3 pt-1">
              {[
                { label: "OPERATIONAL", count: equipment.filter(e => equipStatus(e) === "ok").length, color: "text-emerald-400" },
                { label: "SERVICE DUE", count: equipment.filter(e => equipStatus(e) === "service_due").length, color: "text-amber-400" },
                { label: "MAINTENANCE", count: equipment.filter(e => equipStatus(e) === "maintenance").length, color: "text-rose-400" },
              ].filter(s => s.count > 0).map(s => (
                <div key={s.label} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">
                  <span className={cn("font-bold", s.color)}>{s.count}</span>
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* REGISTRATION DIALOG */}
      <Dialog open={!!registerFor} onOpenChange={o => !o && setRegisterFor(null)}>
        <RegisterDialog gymClass={registerFor} onClose={() => setRegisterFor(null)} onDone={() => load(true)} />
      </Dialog>
    </div>
  )
}