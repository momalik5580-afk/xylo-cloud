"use client"

import { useState, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  Room,
  RoomStatus,
  RoomType,
  STATUS_CONFIG,
  TYPE_CONFIG,
  generateRooms,
  getRoomStats,
} from "@/lib/room-data"
import { RoomDetailDrawer } from "./room-detail-drawer"
import {
  Star, Search,
  LayoutGrid, Layers,
  User, CalendarDays, DollarSign, Wrench,
} from "lucide-react"

// ─── Unified GM-overview cyan theme ──────────────────────────────────────────
// All cards share the same #00f2ff chrome — status is only communicated via
// the animated dot + status label text, exactly like dept-panel cards.

const STATUS_DOT: Record<RoomStatus, string> = {
  occupied:    "bg-blue-400   shadow-[0_0_8px_rgba(59,130,246,0.9)]",
  vacant:      "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]",
  dirty:       "bg-amber-400  shadow-[0_0_8px_rgba(245,158,11,0.9)]",
  inspection:  "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]",
  maintenance: "bg-red-400    shadow-[0_0_8px_rgba(239,68,68,0.9)]",
  reserved:    "bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.9)]",
}

const STATUS_TEXT: Record<RoomStatus, string> = {
  occupied:    "text-blue-400",
  vacant:      "text-emerald-400",
  dirty:       "text-amber-400",
  inspection:  "text-purple-400",
  maintenance: "text-red-400",
  reserved:    "text-orange-400",
}

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({ room, onClick }: { room: Room; onClick: () => void }) {
  const cfg = STATUS_CONFIG[room.status]
  const tc  = TYPE_CONFIG[room.type]

  const rows: { icon: React.ReactNode; label: string; value: string }[] = []
  if (room.guestName)
    rows.push({ icon: <User className="h-3 w-3" />, label: "Guest", value: room.guestName })
  if (room.checkIn && room.checkOut) {
    const ci = new Date(room.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const co = new Date(room.checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    rows.push({ icon: <CalendarDays className="h-3 w-3" />, label: "Stay", value: `${ci} → ${co}` })
  }
  if (room.rate)
    rows.push({ icon: <DollarSign className="h-3 w-3" />, label: "Rate", value: `$${room.rate}/nt` })
  if (room.housekeepingAssigned)
    rows.push({ icon: <Wrench className="h-3 w-3" />, label: "Staff", value: room.housekeepingAssigned })

  const barFilled =
    room.status === "occupied"   ? 3 :
    room.status === "reserved"   ? 2 :
    room.status === "dirty"      ? 1 :
    room.status === "inspection" ? 1 : 0

  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-xl border border-[#00f2ff]/15 bg-[#0a0c10] p-3.5 flex flex-col cursor-pointer transition-all duration-300 text-left group overflow-hidden shadow-[0_0_12px_rgba(0,242,255,0.03)] hover:border-[#00f2ff]/50 hover:shadow-[0_0_25px_rgba(0,242,255,0.12)] hover:bg-[#00f2ff]/[0.02]"
    >
      {/* Hover wash */}
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Header — room number + status (mirrors dept-panel header) */}
      <div className="relative z-10 flex items-center justify-between mb-2.5 pb-2.5 border-b border-[#00f2ff]/10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-widest text-[#00f2ff] drop-shadow-[0_0_6px_rgba(0,242,255,0.25)] group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] transition-all">
            {room.number}
          </span>
          {room.isVIP && (
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.6)]" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[8px] font-bold uppercase tracking-widest", STATUS_TEXT[room.status])}>
            {cfg.label}
          </span>
          <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0 animate-pulse", STATUS_DOT[room.status])} />
        </div>
      </div>

      {/* Type badge */}
      <div className="relative z-10 mb-2">
        <span className="text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded border bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#00f2ff]/70 group-hover:border-[#00f2ff]/30 transition-colors">
          {tc.label}
        </span>
      </div>

      {/* Info rows — same pill style as dept-panel metrics */}
      {rows.length > 0 ? (
        <div className="relative z-10 space-y-1.5 mt-1 flex-1">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg border bg-[#00f2ff]/5 border-[#00f2ff]/15 group-hover:border-[#00f2ff]/30 transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-1.5 text-[#00f2ff]/50">
                {r.icon}
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270] group-hover:text-[#8E939D] transition-colors">
                  {r.label}
                </span>
              </div>
              <span className="text-[9px] font-bold truncate max-w-[100px] text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)] group-hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.4)] transition-all">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex items-center justify-center py-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#3a3f4a]">No Assignment</span>
        </div>
      )}

      {/* Bottom progress bar */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-[#00f2ff]/10 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(
            "h-0.5 flex-1 rounded-full transition-colors duration-300",
            i < barFilled
              ? "bg-[#00f2ff] opacity-70 group-hover:opacity-100 shadow-[0_0_6px_rgba(0,242,255,0.6)]"
              : "bg-white/5"
          )} />
        ))}
      </div>
    </button>
  )
}

// ─── Room Chip (compact) ──────────────────────────────────────────────────────

function RoomChip({ room, onClick }: { room: Room; onClick: () => void }) {
  const cfg = STATUS_CONFIG[room.status]
  return (
    <button
      onClick={onClick}
      title={`Room ${room.number} · ${cfg.label}${room.guestName ? ` · ${room.guestName}` : ""}`}
      className="relative flex flex-col items-center justify-center gap-1 rounded-lg border border-[#00f2ff]/15 bg-[#0a0c10] w-14 h-14 cursor-pointer transition-all duration-300 group overflow-hidden hover:border-[#00f2ff]/50 hover:shadow-[0_0_15px_rgba(0,242,255,0.12)]"
    >
      <div className="absolute inset-0 bg-[#00f2ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <span className="relative z-10 text-[10px] font-bold tracking-tighter text-[#00f2ff]">
        {room.number.length <= 3 ? room.number : room.number.slice(-3)}
      </span>
      <span className={cn("relative z-10 h-1.5 w-1.5 rounded-full animate-pulse", STATUS_DOT[room.status])} />
      {room.isVIP && (
        <Star className="absolute top-0.5 right-0.5 h-2 w-2 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_3px_rgba(234,179,8,0.6)]" />
      )}
    </button>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {(Object.entries(STATUS_CONFIG) as [RoomStatus, typeof STATUS_CONFIG[RoomStatus]][]).map(([status, cfg]) => (
        <div key={status} className="flex items-center gap-2">
          <div className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">{cfg.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 border-l border-[#00f2ff]/20 pl-5">
        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">VIP</span>
      </div>
    </div>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: ReturnType<typeof getRoomStats> }) {
  return (
    <div className="grid grid-cols-4 lg:grid-cols-7 gap-3 mb-2">
      <div className="col-span-4 lg:col-span-1 border border-[#00f2ff]/30 bg-[#00f2ff]/5 px-4 py-3 rounded-xl relative overflow-hidden group hover:bg-[#0a0c10] hover:border-[#00f2ff]/60 transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f2ff]/5 to-transparent" />
        <p className="text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.25)] relative z-10">{`${stats.occupancyRate}%`}</p>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5C6270] mt-1 relative z-10">OCCUPANCY</p>
      </div>
      {(["occupied", "vacant", "dirty", "inspection", "maintenance", "reserved"] as RoomStatus[]).map((status) => {
        const cfg = STATUS_CONFIG[status]
        return (
          <div key={status} className="px-3 py-3 text-center border border-[#00f2ff]/15 bg-[#0a0c10] rounded-xl transition-all duration-300 cursor-default hover:border-[#00f2ff]/30 group">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
              <p className="text-xl font-bold text-[#00f2ff]">{stats[status]}</p>
            </div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-[#5C6270]">{cfg.label}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── RoomGrid ─────────────────────────────────────────────────────────────────

interface RoomGridProps {
  totalRooms: number
  totalFloors: number
  roomNumberFormat?: string
  compact?: boolean
  maxFloors?: number
  selectedFloor?: number | null
  rooms?: Room[]
}

export function RoomGrid({
  totalRooms,
  totalFloors,
  roomNumberFormat,
  compact = false,
  maxFloors,
  rooms: initialRooms,
}: RoomGridProps) {
  const [selectedRoom, setSelectedRoom]   = useState<Room | null>(null)
  const [statusFilter, setStatusFilter]   = useState<RoomStatus | "all">("all")
  const [typeFilter, setTypeFilter]       = useState<RoomType | "all">("all")
  const [searchQuery, setSearchQuery]     = useState("")
  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all")
  const [viewMode, setViewMode]           = useState<"grid" | "compact">(compact ? "compact" : "grid")
  const floorRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const allRooms = useMemo(
    () => initialRooms || generateRooms({ totalFloors, totalRooms, roomNumberFormat }),
    [initialRooms, totalFloors, totalRooms, roomNumberFormat]
  )
  const stats = useMemo(() => getRoomStats(allRooms), [allRooms])

  const floors = useMemo(() => {
    const u = Array.from(new Set(allRooms.map((r) => r.floor))).sort((a, b) => a - b)
    return maxFloors ? u.slice(0, maxFloors) : u
  }, [allRooms, maxFloors])

  const filteredRooms = useMemo(() => {
    return allRooms.filter((room) => {
      if (maxFloors && !floors.includes(room.floor)) return false
      if (statusFilter !== "all" && room.status !== statusFilter) return false
      if (typeFilter !== "all" && room.type !== typeFilter) return false
      if (selectedFloor !== "all" && room.floor !== selectedFloor) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return room.number.includes(q) || (room.guestName?.toLowerCase().includes(q) ?? false)
      }
      return true
    })
  }, [allRooms, statusFilter, typeFilter, selectedFloor, searchQuery, floors, maxFloors])

  const roomsByFloor = useMemo(() => {
    const map: Record<number, Room[]> = {}
    for (const room of filteredRooms) {
      if (!map[room.floor]) map[room.floor] = []
      map[room.floor].push(room)
    }
    return map
  }, [filteredRooms])

  const scrollToFloor = (floor: number) => {
    setSelectedFloor(floor)
    floorRefs.current[floor]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="flex flex-col h-full gap-4">

      {!compact && <StatsBar stats={stats} />}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {!compact && (
          <div className="relative group/search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C6270] group-focus-within/search:text-[#00f2ff] transition-colors" />
            <input
              type="text"
              placeholder="SEARCH UNITS / GUESTS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 text-[10px] font-bold uppercase tracking-widest bg-[#00f2ff]/5 border border-[#00f2ff]/15 rounded-lg text-[#00f2ff] placeholder:text-[#5C6270] focus:outline-none focus:border-[#00f2ff]/50 focus:bg-[#0a0c10] transition-all w-64"
            />
          </div>
        )}

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "h-8 px-4 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all duration-300",
              statusFilter === "all"
                ? "bg-[#00f2ff] text-black border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.4)]"
                : "bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#5C6270] hover:border-[#00f2ff]/30 hover:text-slate-300"
            )}
          >
            ALL
          </button>
          {(Object.entries(STATUS_CONFIG) as [RoomStatus, typeof STATUS_CONFIG[RoomStatus]][]).map(([status, cfg]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status === statusFilter ? "all" : status)}
              className={cn(
                "h-8 px-3 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all duration-300 flex items-center gap-1.5",
                statusFilter === status
                  ? "bg-[#00f2ff]/10 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                  : "bg-[#0a0c10] border-[#00f2ff]/15 text-[#5C6270] hover:border-[#00f2ff]/30 hover:text-[#00f2ff]"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
              {cfg.label}
            </button>
          ))}
        </div>

        {!compact && (
          <div className="flex items-center gap-1.5 border-l border-[#00f2ff]/20 pl-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as RoomType | "all")}
              className="text-[9px] font-bold uppercase tracking-widest bg-[#00f2ff]/5 border border-[#00f2ff]/15 rounded-md text-[#8E939D] px-3 py-2 focus:outline-none focus:border-[#00f2ff]/50 transition-all"
            >
              <option value="all" className="bg-[#0a0c10]">ALL TYPES</option>
              {(Object.entries(TYPE_CONFIG) as [RoomType, typeof TYPE_CONFIG[RoomType]][]).map(([type, cfg]) => (
                <option key={type} value={type} className="bg-[#0a0c10]">{cfg.label.toUpperCase()}</option>
              ))}
            </select>
          </div>
        )}

        {!compact && (
          <div className="ml-auto flex items-center gap-1 bg-[#00f2ff]/5 border border-[#00f2ff]/15 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded-md transition-all duration-300", viewMode === "grid" ? "bg-[#00f2ff] text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]" : "text-[#5C6270] hover:text-[#00f2ff]")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={cn("p-1.5 rounded-md transition-all duration-300", viewMode === "compact" ? "bg-[#00f2ff] text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]" : "text-[#5C6270] hover:text-[#00f2ff]")}
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Floor quick-jump */}
      {!compact && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#5C6270] flex-shrink-0 mr-2">FLOOR:</span>
          <button
            onClick={() => setSelectedFloor("all")}
            className={cn(
              "h-7 px-3 rounded text-[9px] font-bold uppercase tracking-widest flex-shrink-0 transition-all duration-300 border",
              selectedFloor === "all"
                ? "bg-[#00f2ff] text-black border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.4)]"
                : "bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#5C6270] hover:border-[#00f2ff]/30 hover:text-[#00f2ff]"
            )}
          >ALL</button>
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => scrollToFloor(floor)}
              className={cn(
                "h-7 px-3 rounded text-[9px] font-bold uppercase tracking-widest flex-shrink-0 transition-all duration-300 border",
                selectedFloor === floor
                  ? "bg-[#00f2ff] text-black border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.4)]"
                  : "bg-[#00f2ff]/5 border-[#00f2ff]/15 text-[#5C6270] hover:border-[#00f2ff]/30 hover:text-[#00f2ff]"
              )}
            >
              {`F${floor.toString().padStart(2, "0")}`}
            </button>
          ))}
        </div>
      )}

      {/* Grid area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-[#00f2ff]/10 bg-[#060709] min-h-0">
        {!compact && (
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 bg-[#060709]/95 backdrop-blur border-b border-[#00f2ff]/10">
            <Legend />
            <div className="flex items-center gap-2 text-xs text-[#8E939D]">
              <span className="text-slate-300 font-medium">{filteredRooms.length}</span>
              <span>{`/ ${allRooms.length} rooms`}</span>
            </div>
          </div>
        )}

        <div className="p-4 space-y-6">
          {floors.map((floor) => {
            const floorRooms = roomsByFloor[floor]
            if (!floorRooms || floorRooms.length === 0) return null

            const floorOccupied = floorRooms.filter((r) => r.status === "occupied").length
            const floorVIP      = floorRooms.filter((r) => r.isVIP).length

            return (
              <div key={floor} ref={(el) => { floorRefs.current[floor] = el }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-7 rounded-md bg-[#00f2ff]/10 border border-[#00f2ff]/25 flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#00f2ff] tracking-widest">
                      {`F${floor.toString().padStart(2, "0")}`}
                    </span>
                  </div>
                  {!compact && (
                    <>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#00f2ff]/20 to-transparent" />
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-[#00f2ff]/70 font-medium text-[10px]">{`${floorOccupied} occupied`}</span>
                        {floorVIP > 0 && (
                          <span className="text-yellow-400 flex items-center gap-1 text-[10px]">
                            <Star className="h-2.5 w-2.5 fill-yellow-400" />{`${floorVIP} VIP`}
                          </span>
                        )}
                        <span className="text-[#5C6270] text-[10px]">{`${floorRooms.length} rooms`}</span>
                      </div>
                    </>
                  )}
                </div>

                {viewMode === "compact" ? (
                  <div className="flex flex-wrap gap-2 pl-1">
                    {floorRooms.sort((a, b) => a.position - b.position).map((room) => (
                      <RoomChip key={room.id} room={room} onClick={() => setSelectedRoom(room)} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                    {floorRooms.sort((a, b) => a.position - b.position).map((room) => (
                      <RoomCard key={room.id} room={room} onClick={() => setSelectedRoom(room)} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <RoomDetailDrawer room={selectedRoom} onClose={() => setSelectedRoom(null)} />
    </div>
  )
}
